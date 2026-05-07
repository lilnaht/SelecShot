import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowDownToLine, Clock3, FileWarning, RefreshCw, ScanLine } from "lucide-react";

import { AnalysisFilesTable } from "@/components/dashboard/analysis-files-table";
import { AnalysisStatusBadge } from "@/components/dashboard/analysis-status-badge";
import { AnalysisSummaryCard } from "@/components/dashboard/analysis-summary-card";
import { CategoryPreviewSection } from "@/components/dashboard/category-preview-section";
import { RetryAnalysisButton } from "@/components/dashboard/retry-analysis-button";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CATEGORY_LABELS } from "@/lib/constants";
import { getAnalysisDetail } from "@/lib/analyses";
import { isUuid, sanitizeRedirectPath } from "@/lib/security";
import { getCurrentUser } from "@/lib/supabase/server";
import type { ImageCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

const categories: ImageCategory[] = ["dark", "bright", "blurred", "good"];

export default async function AnalysisDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const isValidAnalysisId = id.startsWith("mock") || isUuid(id);

  if (!isValidAnalysisId) {
    notFound();
  }

  const user = await getCurrentUser();

  if (!user) {
    const nextPath = sanitizeRedirectPath(`/dashboard/analyses/${id}`);
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  const detail = await getAnalysisDetail(user.id, id);

  if (!detail) {
    notFound();
  }

  const { analysis, files, zipUrl } = detail;

  const counts = {
    dark: analysis.dark_count,
    bright: analysis.bright_count,
    blurred: analysis.blurred_count,
    good: analysis.good_count,
  };
  const processedFiles = analysis.processed_files ?? files.filter((file) => file.category).length;
  const failedFiles =
    analysis.failed_files ?? files.filter((file) => file.processing_error).length;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="mb-3">
            <AnalysisStatusBadge status={analysis.status} />
          </div>
          <h1 className="text-3xl font-semibold">
            {analysis.status === "done" ? "Análise finalizada." : "Detalhe da análise"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {analysis.status === "processing" || analysis.status === "pending"
              ? "Analisando brilho, exposição e nitidez."
              : "Resumo técnico do lote enviado."}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href={`/dashboard/analyses/${analysis.id}`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            <RefreshCw data-icon="inline-start" />
            Atualizar status
          </Link>
          {analysis.status === "done" && (
            <Link
              href={zipUrl ?? "#"}
              className={cn(buttonVariants(), "brand-gradient")}
              aria-disabled={!zipUrl}
            >
              <ArrowDownToLine data-icon="inline-start" />
              Baixar pacote organizado
            </Link>
          )}
        </div>
      </div>

      {analysis.status === "done" && !zipUrl && (
        <Alert variant="destructive">
          <FileWarning data-icon="inline-start" />
          <AlertTitle>Pacote indisponivel</AlertTitle>
          <AlertDescription>
            A analise terminou, mas o ZIP ainda nao esta disponivel. Atualize o status
            ou reprocese o lote se o problema continuar.
          </AlertDescription>
        </Alert>
      )}

      {(analysis.status === "pending" ||
        analysis.status === "uploading" ||
        analysis.status === "processing") && (
        <Card className="border-white/10 bg-white/[0.035]">
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="flex size-14 items-center justify-center rounded-xl bg-sky-300/10 text-sky-200">
              <ScanLine aria-hidden="true" />
            </div>
            <div>
              <p className="text-lg font-medium">
                Analisando brilho, exposição e nitidez.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                O processador TypeScript atualiza esta análise assim que concluir.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {analysis.status === "failed" && (
        <div className="flex flex-col gap-4">
          <ErrorState
            description={
              analysis.error_message
                ? "Não foi possível processar este lote. Tente novamente com imagens JPG, PNG ou WebP dentro dos limites."
                : undefined
            }
          />
          {!analysis.id.startsWith("mock") && <RetryAnalysisButton analysisId={analysis.id} />}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <AnalysisSummaryCard
          title="Total de fotos"
          value={analysis.total_files}
          icon={ScanLine}
        />
        <AnalysisSummaryCard
          title="Processadas"
          value={processedFiles}
          description={`${failedFiles} arquivo(s) invalidos`}
          icon={ScanLine}
        />
        {categories.map((category) => (
          <AnalysisSummaryCard
            key={category}
            title={CATEGORY_LABELS[category]}
            value={counts[category]}
            icon={ScanLine}
          />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <AnalysisSummaryCard
          title="Inicio do processamento"
          value={
            analysis.processing_started_at
              ? new Date(analysis.processing_started_at).toLocaleDateString("pt-BR")
              : "Pendente"
          }
          description={
            analysis.processing_started_at
              ? new Date(analysis.processing_started_at).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Aguardando worker"
          }
          icon={Clock3}
        />
        <AnalysisSummaryCard
          title="Duracao"
          value={formatDuration(analysis.processing_duration_ms)}
          description="Tempo total registrado pelo worker"
          icon={Clock3}
        />
        <AnalysisSummaryCard
          title="ZIP"
          value={formatBytes(analysis.zip_size_bytes)}
          description={zipUrl ? "Disponivel para download" : "Ainda indisponivel"}
          icon={ArrowDownToLine}
        />
      </div>

      {analysis.status === "done" ? (
        <Tabs defaultValue="previews">
          <TabsList>
            <TabsTrigger value="previews">Previews</TabsTrigger>
            <TabsTrigger value="files">Todos os arquivos</TabsTrigger>
          </TabsList>
          <TabsContent value="previews" className="flex flex-col gap-5">
            {categories.map((category) => (
              <CategoryPreviewSection
                key={category}
                category={category}
                files={files.filter((file) => file.category === category)}
                downloadHref={
                  analysis.id.startsWith("mock")
                    ? null
                    : `/api/analyses/${analysis.id}/category/${category}`
                }
              />
            ))}
          </TabsContent>
          <TabsContent value="files">
            <AnalysisFilesTable files={files} />
          </TabsContent>
        </Tabs>
      ) : (
        <EmptyState
          icon={ScanLine}
          title="Previews ainda indisponíveis"
          description="Quando a análise for finalizada, até 10 fotos de cada categoria aparecerão aqui."
        />
      )}
    </div>
  );
}

function formatDuration(value: number | null) {
  if (!value) {
    return "Sem dados";
  }

  const seconds = Math.round(value / 1000);

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return remainingSeconds ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
}

function formatBytes(value: number | null) {
  if (!value) {
    return "Sem dados";
  }

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(units.length - 1, Math.floor(Math.log(value) / Math.log(1024)));
  const scaled = value / 1024 ** index;

  return `${scaled.toFixed(scaled >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}
