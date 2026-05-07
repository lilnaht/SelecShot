import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarClock, FolderKanban, Image, Sparkles } from "lucide-react";

import { AnalysisStatusBadge } from "@/components/dashboard/analysis-status-badge";
import { AnalysisSummaryCard } from "@/components/dashboard/analysis-summary-card";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAnalysesForUser, getDashboardStats } from "@/lib/analyses";
import { getCurrentUser } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const analyses = await getAnalysesForUser(user.id);
  const stats = getDashboardStats(analyses);

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
          title="Total de análises"
          value={stats.totalAnalyses}
          icon={FolderKanban}
        />
        <AnalysisSummaryCard
          title="Fotos processadas no mês"
          value={stats.monthlyFiles}
          icon={Image}
        />
        <AnalysisSummaryCard title="Plano atual" value={stats.plan} icon={Sparkles} />
        <AnalysisSummaryCard
          title="Última análise"
          value={stats.lastAnalysis ? "Recente" : "Nenhuma"}
          description={
            stats.lastAnalysis
              ? new Date(stats.lastAnalysis.created_at).toLocaleDateString("pt-BR")
              : "Crie seu primeiro lote"
          }
          icon={CalendarClock}
        />
      </div>
      <Card id="recentes" className="border-white/10 bg-white/[0.035]">
        <CardHeader>
          <CardTitle>Análises recentes</CardTitle>
          <CardDescription>
            Dados reais do Supabase com amostras mockadas quando não há análises.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analyses.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lote</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Escuras</TableHead>
                  <TableHead>Claras</TableHead>
                  <TableHead>Desfocadas</TableHead>
                  <TableHead>Boas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyses.map((analysis) => (
                  <TableRow key={analysis.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/analyses/${analysis.id}`}
                        className="font-medium text-foreground hover:text-sky-200"
                      >
                        {analysis.id.startsWith("mock")
                          ? "Evento esportivo"
                          : analysis.id.slice(0, 8)}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {new Date(analysis.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </TableCell>
                    <TableCell>
                      <AnalysisStatusBadge status={analysis.status} />
                    </TableCell>
                    <TableCell>{analysis.total_files}</TableCell>
                    <TableCell>{analysis.dark_count}</TableCell>
                    <TableCell>{analysis.bright_count}</TableCell>
                    <TableCell>{analysis.blurred_count}</TableCell>
                    <TableCell>{analysis.good_count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              icon={FolderKanban}
              title="Nenhuma análise ainda"
              description="Envie suas fotos para criar o primeiro lote organizado."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
