"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileWarning,
  Loader2,
  UploadCloud,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { UploadProgress } from "@/components/dashboard/upload-progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ACCEPTED_IMAGE_EXTENSIONS,
  MAX_FILES_PER_ANALYSIS,
  MAX_TOTAL_UPLOAD_SIZE_BYTES,
  STORAGE_BUCKET,
} from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatBytes, sanitizeFileName, validateImageFile } from "@/lib/upload";
import { cn } from "@/lib/utils";

type UploadState =
  | "idle"
  | "selected"
  | "creating"
  | "uploading"
  | "canceling"
  | "canceled"
  | "analyzing"
  | "submitted"
  | "error";

type RejectedFileFeedback = {
  id: string;
  name: string;
  size: number;
  reason: string;
};

type BrowserSupabaseClient = NonNullable<
  ReturnType<typeof createSupabaseBrowserClient>
>;

const safeCancelMessage =
  "Upload cancelado pelo usuário antes do processamento.";

export function UploadDropzone() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelRequestedRef = useRef(false);
  const [files, setFiles] = useState<File[]>([]);
  const [rejectedFiles, setRejectedFiles] = useState<RejectedFileFeedback[]>([]);
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const totalSize = useMemo(
    () => files.reduce((total, file) => total + file.size, 0),
    [files]
  );

  const estimatedProcessingSeconds = useMemo(
    () => estimateProcessingSeconds(files.length, totalSize),
    [files.length, totalSize]
  );

  const isBusy =
    state === "creating" ||
    state === "uploading" ||
    state === "canceling" ||
    state === "analyzing";
  const canChangeSelection = !isBusy && state !== "submitted";
  const hasSelectedFiles = files.length > 0;

  function addFiles(fileList: FileList | null) {
    if (!fileList || !canChangeSelection) {
      return;
    }

    const incoming = Array.from(fileList);
    const valid: File[] = [];
    const rejected: RejectedFileFeedback[] = [];
    const existingKeys = new Set(files.map(getDuplicateKey));
    const incomingKeys = new Set<string>();
    let nextTotalSize = totalSize;
    let nextFileCount = files.length;

    for (const [index, file] of incoming.entries()) {
      const duplicateKey = getDuplicateKey(file);
      const validationError = validateImageFile(file);
      let reason = validationError;

      if (!reason && (existingKeys.has(duplicateKey) || incomingKeys.has(duplicateKey))) {
        reason = "nome e tamanho duplicados neste lote";
      }

      if (!reason && nextFileCount >= MAX_FILES_PER_ANALYSIS) {
        reason = `limite de ${MAX_FILES_PER_ANALYSIS} arquivos`;
      }

      if (!reason && nextTotalSize + file.size > MAX_TOTAL_UPLOAD_SIZE_BYTES) {
        reason = `limite total de ${formatBytes(MAX_TOTAL_UPLOAD_SIZE_BYTES)}`;
      }

      if (reason) {
        rejected.push({
          id: `${file.name}-${file.size}-${file.lastModified}-${index}`,
          name: file.name,
          size: file.size,
          reason,
        });
        continue;
      }

      valid.push(file);
      incomingKeys.add(duplicateKey);
      nextFileCount += 1;
      nextTotalSize += file.size;
    }

    setFiles((current) => [...current, ...valid]);
    setRejectedFiles(rejected);
    setError(null);
    setProgress(0);
    setState(valid.length || files.length ? "selected" : "idle");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function removeFile(index: number) {
    if (!canChangeSelection) {
      return;
    }

    const nextFiles = files.filter((_, currentIndex) => currentIndex !== index);
    setFiles(nextFiles);
    setState(nextFiles.length ? "selected" : "idle");
    setError(null);
  }

  function clearSelection(nextState: UploadState = "idle") {
    if (isBusy) {
      return;
    }

    cancelRequestedRef.current = false;
    setFiles([]);
    setRejectedFiles([]);
    setProgress(0);
    setError(null);
    setState(nextState);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function requestCancel() {
    if (state === "creating" || state === "uploading") {
      cancelRequestedRef.current = true;
      setError(null);
      setState("canceling");
      return;
    }

    if (state === "selected" || state === "error" || state === "canceled") {
      clearSelection();
    }
  }

  async function markAnalysisCanceled(
    supabase: BrowserSupabaseClient,
    analysisId: string,
    userId: string
  ) {
    await supabase
      .from("analyses")
      .update({
        status: "failed",
        error_message: safeCancelMessage,
      })
      .eq("id", analysisId)
      .eq("user_id", userId);

    cancelRequestedRef.current = false;
    setProgress(0);
    setState("canceled");
  }

  async function startUpload() {
    setError(null);
    cancelRequestedRef.current = false;

    if (!files.length) {
      setError("Selecione pelo menos uma imagem para iniciar a análise.");
      return;
    }

    if (files.length > MAX_FILES_PER_ANALYSIS) {
      setError(`Envie no máximo ${MAX_FILES_PER_ANALYSIS} imagens por análise.`);
      return;
    }

    if (totalSize > MAX_TOTAL_UPLOAD_SIZE_BYTES) {
      setError(
        `O lote deve ter no máximo ${formatBytes(MAX_TOTAL_UPLOAD_SIZE_BYTES)}.`
      );
      return;
    }

    const invalidFile = files.find((file) => validateImageFile(file));

    if (invalidFile) {
      setError(`${invalidFile.name} não é uma imagem aceita.`);
      return;
    }

    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      setError(
        "Supabase não está configurado. Configure as variáveis de ambiente para usar upload real."
      );
      setState("error");
      return;
    }

    setState("creating");
    setProgress(3);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("Sua sessão expirou. Entre novamente para enviar fotos.");
      setState("error");
      return;
    }

    if (cancelRequestedRef.current) {
      setState("canceled");
      setProgress(0);
      cancelRequestedRef.current = false;
      return;
    }

    const { data: analysis, error: analysisError } = await supabase
      .from("analyses")
      .insert({
        user_id: user.id,
        status: "uploading",
        total_files: files.length,
      })
      .select("id")
      .single();

    if (analysisError || !analysis) {
      console.error("Failed to create analysis", analysisError);
      setError("Não foi possível criar a análise.");
      setState("error");
      return;
    }

    if (cancelRequestedRef.current) {
      await markAnalysisCanceled(supabase, analysis.id, user.id);
      return;
    }

    setState("uploading");

    const rows = [];

    for (const [index, file] of files.entries()) {
      if (cancelRequestedRef.current) {
        await markAnalysisCanceled(supabase, analysis.id, user.id);
        return;
      }

      const safeName = `${String(index + 1).padStart(4, "0")}-${sanitizeFileName(
        file.name
      )}`;
      const storagePath = `uploads/${user.id}/${analysis.id}/originals/${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (cancelRequestedRef.current) {
        await markAnalysisCanceled(supabase, analysis.id, user.id);
        return;
      }

      if (uploadError) {
        console.error("Failed to upload image", uploadError);
        await supabase
          .from("analyses")
          .update({
            status: "failed",
            error_message: "Falha no upload de uma imagem.",
          })
          .eq("id", analysis.id)
          .eq("user_id", user.id);

        setError("Falha no upload de uma imagem.");
        setState("error");
        return;
      }

      rows.push({
        analysis_id: analysis.id,
        user_id: user.id,
        original_filename: file.name,
        storage_path: storagePath,
      });

      setProgress(Math.round(((index + 1) / files.length) * 88) + 5);
    }

    if (cancelRequestedRef.current) {
      await markAnalysisCanceled(supabase, analysis.id, user.id);
      return;
    }

    const { error: filesError } = await supabase.from("analysis_files").insert(rows);

    if (filesError) {
      console.error("Failed to register analysis files", filesError);
      await supabase
        .from("analyses")
        .update({
          status: "failed",
          error_message: "Falha ao registrar os arquivos da análise.",
        })
        .eq("id", analysis.id)
        .eq("user_id", user.id);
      setError("Falha ao registrar os arquivos da análise.");
      setState("error");
      return;
    }

    if (cancelRequestedRef.current) {
      await markAnalysisCanceled(supabase, analysis.id, user.id);
      return;
    }

    await supabase
      .from("analyses")
      .update({ status: "pending" })
      .eq("id", analysis.id)
      .eq("user_id", user.id);

    setState("analyzing");
    setProgress(94);

    const triggerResponse = await fetch("/api/worker/trigger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ analysis_id: analysis.id }),
    });

    if (!triggerResponse.ok) {
      await triggerResponse.json().catch(() => null);
      setError("Não foi possível processar a análise.");
      setState("error");
      return;
    }

    setState("submitted");
    setProgress(100);

    toast.success("Análise finalizada.");
    router.push(`/dashboard/analyses/${analysis.id}`);
    router.refresh();
  }

  const stateLabel =
    state === "creating"
      ? "Criando análise..."
      : state === "uploading"
        ? "Enviando suas imagens..."
        : state === "canceling"
          ? "Cancelando com segurança..."
          : state === "analyzing"
            ? "Analisando imagens..."
            : state === "submitted"
              ? "Análise finalizada"
              : state === "canceled"
                ? "Envio cancelado"
                : "Aguardando fotos";

  const progressDescription =
    state === "analyzing"
      ? "O processamento já foi iniciado; a análise aparecerá no histórico quando terminar."
      : state === "canceling"
        ? "A solicitação vai parar antes de iniciar o worker. O arquivo em envio atual pode terminar primeiro."
        : `Estimativa para este lote: ${formatEstimatedDuration(
            estimatedProcessingSeconds
          )}.`;

  return (
    <Card className="border-white/10 bg-white/[0.035]">
      <CardHeader>
        <CardTitle>Nova análise</CardTitle>
        <CardDescription>
          Envie fotos em lote. Os originais são preservados no Storage.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <button
          type="button"
          disabled={!canChangeSelection}
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            addFiles(event.dataTransfer.files);
          }}
          className={cn(
            "flex min-h-64 flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-white/15 bg-black/25 p-6 text-center transition-colors hover:border-sky-300/40 hover:bg-sky-300/[0.035]",
            state === "error" && "border-red-300/35",
            !canChangeSelection && "cursor-not-allowed opacity-60"
          )}
        >
          <div className="flex size-12 items-center justify-center rounded-lg bg-sky-300/10 text-sky-200">
            <UploadCloud aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-lg font-medium">
              Arraste suas fotos aqui ou clique para selecionar.
            </p>
            <p className="text-sm text-muted-foreground">
              Formatos aceitos: {ACCEPTED_IMAGE_EXTENSIONS.join(", ")} · até{" "}
              {MAX_FILES_PER_ANALYSIS} imagens por lote
            </p>
          </div>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_IMAGE_EXTENSIONS.join(",")}
          multiple
          className="hidden"
          onChange={(event) => addFiles(event.currentTarget.files)}
        />
        {hasSelectedFiles && (
          <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-black/25 p-4">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
              <div className="grid gap-2 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">Arquivos válidos</p>
                  <p className="text-lg font-semibold">{files.length}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tamanho total</p>
                  <p className="text-lg font-semibold">{formatBytes(totalSize)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tempo estimado</p>
                  <p className="text-lg font-semibold">
                    {formatEstimatedDuration(estimatedProcessingSeconds)}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  onClick={requestCancel}
                  disabled={state === "canceling" || state === "analyzing"}
                >
                  <X data-icon="inline-start" />
                  {state === "creating" || state === "uploading"
                    ? "Cancelar envio"
                    : "Limpar seleção"}
                </Button>
                <Button
                  onClick={startUpload}
                  disabled={isBusy || state === "submitted"}
                >
                  {isBusy && <Loader2 data-icon="inline-start" className="animate-spin" />}
                  Iniciar envio
                </Button>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {files.slice(0, 12).map((file, index) => (
                <div
                  key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-emerald-300/15 bg-emerald-300/[0.035] p-2"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <CheckCircle2
                      aria-hidden="true"
                      className="size-4 shrink-0 text-emerald-200"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatBytes(file.size)} · pronto para envio
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    disabled={!canChangeSelection}
                    className="text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                    aria-label={`Remover ${file.name}`}
                  >
                    <X aria-hidden="true" className="size-4" />
                  </button>
                </div>
              ))}
            </div>
            {files.length > 12 && (
              <p className="text-xs text-muted-foreground">
                Mais {files.length - 12} arquivo(s) válidos serão enviados neste lote.
              </p>
            )}
          </div>
        )}
        {rejectedFiles.length > 0 && (
          <div className="flex flex-col gap-2 rounded-xl border border-amber-300/15 bg-amber-300/[0.035] p-4">
            <div className="flex items-start gap-2">
              <FileWarning className="mt-0.5 size-4 shrink-0 text-amber-200" />
              <div>
                <p className="font-medium">Arquivos rejeitados antes do envio</p>
                <p className="text-sm text-muted-foreground">
                  Corrija os itens abaixo ou envie apenas os arquivos válidos.
                </p>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {rejectedFiles.slice(0, 8).map((file) => (
                <div
                  key={file.id}
                  className="rounded-lg border border-white/10 bg-black/20 p-2"
                >
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(file.size)} · {file.reason}
                  </p>
                </div>
              ))}
            </div>
            {rejectedFiles.length > 8 && (
              <p className="text-xs text-muted-foreground">
                Mais {rejectedFiles.length - 8} arquivo(s) foram rejeitados.
              </p>
            )}
          </div>
        )}
        {(state === "uploading" ||
          state === "creating" ||
          state === "canceling" ||
          state === "analyzing" ||
          state === "submitted") && (
          <UploadProgress
            value={progress}
            label={stateLabel}
            description={progressDescription}
          />
        )}
        {state === "selected" && (
          <Alert>
            <Clock3 data-icon="inline-start" />
            <AlertTitle>Estimativa antes do envio</AlertTitle>
            <AlertDescription>
              Este lote deve levar {formatEstimatedDuration(estimatedProcessingSeconds)}
              . Você ainda pode remover arquivos duplicados ou cancelar a seleção.
            </AlertDescription>
          </Alert>
        )}
        {state === "canceled" && (
          <Alert>
            <CheckCircle2 data-icon="inline-start" />
            <AlertTitle>Envio cancelado</AlertTitle>
            <AlertDescription>
              O processamento não foi iniciado. Você pode ajustar os arquivos e enviar
              novamente quando quiser.
            </AlertDescription>
          </Alert>
        )}
        {state === "submitted" && (
          <Alert>
            <CheckCircle2 data-icon="inline-start" />
            <AlertTitle>Análise finalizada</AlertTitle>
            <AlertDescription>
              O lote foi processado com brilho, exposição, nitidez e preview.
            </AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertCircle data-icon="inline-start" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

function getDuplicateKey(file: File) {
  return `${file.name.trim().toLowerCase()}::${file.size}`;
}

function estimateProcessingSeconds(fileCount: number, totalBytes: number) {
  if (!fileCount) {
    return 0;
  }

  const totalMegabytes = totalBytes / (1024 * 1024);
  return Math.ceil(Math.max(30, 18 + fileCount * 1.4 + totalMegabytes * 0.18));
}

function formatEstimatedDuration(seconds: number) {
  if (!seconds) {
    return "aguardando arquivos";
  }

  if (seconds < 75) {
    return "menos de 1 minuto";
  }

  const minutes = Math.max(1, Math.round(seconds / 60));
  return `cerca de ${minutes} min`;
}
