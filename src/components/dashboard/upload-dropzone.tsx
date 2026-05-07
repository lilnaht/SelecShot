"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, ImagePlus, Loader2, UploadCloud, X } from "lucide-react";
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
  | "uploading"
  | "creating"
  | "analyzing"
  | "submitted"
  | "error";

export function UploadDropzone() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [invalidFiles, setInvalidFiles] = useState<string[]>([]);
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const totalSize = useMemo(
    () => files.reduce((total, file) => total + file.size, 0),
    [files]
  );

  function addFiles(fileList: FileList | null) {
    if (!fileList) {
      return;
    }

    const incoming = Array.from(fileList);
    const valid: File[] = [];
    const invalid: string[] = [];
    let nextTotalSize = totalSize;

    for (const file of incoming) {
      const validationError = validateImageFile(file);

      if (validationError) {
        invalid.push(`${file.name} (${validationError})`);
        continue;
      }

      if (files.length + valid.length >= MAX_FILES_PER_ANALYSIS) {
        invalid.push(`${file.name} (limite de ${MAX_FILES_PER_ANALYSIS} arquivos)`);
        continue;
      }

      if (nextTotalSize + file.size > MAX_TOTAL_UPLOAD_SIZE_BYTES) {
        invalid.push(
          `${file.name} (limite total de ${formatBytes(
            MAX_TOTAL_UPLOAD_SIZE_BYTES
          )})`
        );
        continue;
      }

      valid.push(file);
      nextTotalSize += file.size;
    }

    setFiles((current) => [...current, ...valid]);
    setInvalidFiles(invalid);
    setError(null);
    setState(valid.length || files.length ? "selected" : "idle");
  }

  function removeFile(index: number) {
    setFiles((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  async function startUpload() {
    setError(null);

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

    setState("uploading");

    const rows = [];

    for (const [index, file] of files.entries()) {
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
        : state === "analyzing"
          ? "Analisando imagens..."
        : state === "submitted"
          ? "Análise finalizada"
          : "Aguardando fotos";

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
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            addFiles(event.dataTransfer.files);
          }}
          className={cn(
            "flex min-h-64 flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-white/15 bg-black/25 p-6 text-center transition-colors hover:border-sky-300/40 hover:bg-sky-300/[0.035]",
            state === "error" && "border-red-300/35"
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
              Formatos aceitos: {ACCEPTED_IMAGE_EXTENSIONS.join(" ")}
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
        {files.length > 0 && (
          <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/25 p-4">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <p className="font-medium">{files.length} arquivos selecionados</p>
                <p className="text-sm text-muted-foreground">
                  Tamanho estimado: {formatBytes(totalSize)}
                </p>
              </div>
              <Button
                onClick={startUpload}
                disabled={
                  state === "uploading" ||
                  state === "creating" ||
                  state === "analyzing"
                }
              >
                {(state === "uploading" ||
                  state === "creating" ||
                  state === "analyzing") && (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                )}
                Iniciar envio
              </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {files.slice(0, 9).map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-2"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <ImagePlus aria-hidden="true" className="shrink-0 text-sky-200" />
                    <span className="truncate text-sm">{file.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label={`Remover ${file.name}`}
                  >
                    <X aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        {(state === "uploading" ||
          state === "creating" ||
          state === "analyzing" ||
          state === "submitted") && (
          <UploadProgress value={progress} label={stateLabel} />
        )}
        {invalidFiles.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle data-icon="inline-start" />
            <AlertTitle>Arquivos rejeitados</AlertTitle>
            <AlertDescription>
              {invalidFiles.slice(0, 5).join(", ")}
              {invalidFiles.length > 5
                ? ` e mais ${invalidFiles.length - 5} arquivo(s)`
                : ""}{" "}
              não foram aceitos.
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
