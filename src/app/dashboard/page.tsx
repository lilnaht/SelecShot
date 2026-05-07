import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarClock, FolderKanban, Image, Sparkles } from "lucide-react";

import { AnalysisHistory } from "@/components/dashboard/analysis-history";
import { AnalysisSummaryCard } from "@/components/dashboard/analysis-summary-card";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAnalysesForUser, getDashboardStats } from "@/lib/analyses";
import { getCurrentUser } from "@/lib/supabase/server";
import type { Analysis } from "@/lib/types";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const analyses = await getAnalysesForUser(user.id);
  const stats = getDashboardStats(analyses);
  const metrics = getDashboardMetrics(analyses);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-semibold">Olá, vamos organizar seu lote.</h1>
          <p className="mt-2 text-muted-foreground">
            Acompanhe suas análises recentes e inicie uma nova triagem.
          </p>
        </div>
        <Link
          href="/dashboard/new-analysis"
          className={cn(buttonVariants({ size: "lg" }), "brand-gradient")}
        >
          Nova análise
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AnalysisSummaryCard
          title="Análises no mês"
          value={metrics.monthlyAnalyses}
          description={metrics.monthlyAnalysesTrend}
          icon={FolderKanban}
        />
        <AnalysisSummaryCard
          title="Fotos no mês"
          value={metrics.monthlyFiles}
          description={metrics.monthlyFilesTrend}
          icon={Image}
        />
        <AnalysisSummaryCard
          title="Descarte técnico"
          value={metrics.discardRate}
          description="Escuras, claras ou desfocadas"
          icon={Sparkles}
        />
        <AnalysisSummaryCard
          title="Tempo médio"
          value={metrics.averageProcessingTime}
          description={
            stats.lastAnalysis
              ? `Último lote: ${new Date(
                  stats.lastAnalysis.created_at
                ).toLocaleDateString("pt-BR")}`
              : "Crie seu primeiro lote"
          }
          icon={CalendarClock}
        />
      </div>
      <Card id="recentes" className="border-white/10 bg-white/[0.035]">
        <CardHeader>
          <CardTitle>Análises recentes</CardTitle>
          <CardDescription>
            Filtre por status, período, volume de fotos ou ID do lote.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AnalysisHistory analyses={analyses} referenceTime={metrics.referenceTime} />
        </CardContent>
      </Card>
    </div>
  );
}

function getDashboardMetrics(analyses: Analysis[]) {
  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  const monthlyAnalyses = analyses.filter(
    (analysis) => now - new Date(analysis.created_at).getTime() <= thirtyDays
  );
  const previousAnalyses = analyses.filter((analysis) => {
    const age = now - new Date(analysis.created_at).getTime();
    return age > thirtyDays && age <= thirtyDays * 2;
  });
  const monthlyFiles = sumFiles(monthlyAnalyses);
  const previousMonthlyFiles = sumFiles(previousAnalyses);
  const processedFiles = sumFiles(
    analyses.filter((analysis) => analysis.status === "done")
  );
  const discardedFiles = analyses.reduce(
    (total, analysis) =>
      total + analysis.dark_count + analysis.bright_count + analysis.blurred_count,
    0
  );
  const finishedDurations = analyses
    .filter((analysis) => analysis.finished_at)
    .map(
      (analysis) =>
        new Date(analysis.finished_at!).getTime() -
        new Date(analysis.created_at).getTime()
    )
    .filter((duration) => duration >= 0);
  const averageDuration =
    finishedDurations.length > 0
      ? finishedDurations.reduce((total, duration) => total + duration, 0) /
        finishedDurations.length
      : 0;

  return {
    referenceTime: now,
    monthlyAnalyses: monthlyAnalyses.length,
    monthlyAnalysesTrend: formatTrend(monthlyAnalyses.length, previousAnalyses.length),
    monthlyFiles,
    monthlyFilesTrend: formatTrend(monthlyFiles, previousMonthlyFiles),
    discardRate: processedFiles
      ? `${Math.round((discardedFiles / processedFiles) * 100)}%`
      : "0%",
    averageProcessingTime: averageDuration
      ? formatProcessingTime(averageDuration)
      : "Sem dados",
  };
}

function sumFiles(analyses: Analysis[]) {
  return analyses.reduce((total, analysis) => total + analysis.total_files, 0);
}

function formatTrend(current: number, previous: number) {
  if (!previous && current) {
    return "novo nos últimos 30 dias";
  }

  if (!previous) {
    return "sem variação mensal";
  }

  const percentage = Math.round(((current - previous) / previous) * 100);

  if (percentage === 0) {
    return "sem variação mensal";
  }

  return `${percentage > 0 ? "+" : ""}${percentage}% vs. período anterior`;
}

function formatProcessingTime(durationMs: number) {
  const minutes = Math.round(durationMs / 60000);

  if (minutes < 1) {
    return "<1 min";
  }

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
}
