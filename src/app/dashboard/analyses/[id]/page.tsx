import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowDownToLine, RefreshCw, RotateCcw, ScanLine } from "lucide-react";

import { AnalysisStatusBadge } from "@/components/dashboard/analysis-status-badge";
import { AnalysisSummaryCard } from "@/components/dashboard/analysis-summary-card";
import { CategoryPreviewSection } from "@/components/dashboard/category-preview-section";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CATEGORY_LABELS } from "@/lib/constants";
import { getAnalysisDetail } from "@/lib/analyses";
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
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=/dashboard/analyses/${id}`);
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
          <ErrorState description={analysis.error_message ?? undefined} />
          <div>
            <Button variant="outline" disabled>
              <RotateCcw data-icon="inline-start" />
              Tentar novamente futuramente
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <AnalysisSummaryCard
          title="Total de fotos"
          value={analysis.total_files}
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

      {analysis.status === "done" ? (
        <div className="flex flex-col gap-5">
          {categories.map((category) => (
            <CategoryPreviewSection
              key={category}
              category={category}
              files={files.filter((file) => file.category === category)}
            />
          ))}
        </div>
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
