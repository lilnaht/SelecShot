import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarClock,
  HardDrive,
  Image,
  MailCheck,
  Sparkles,
  UserRound,
} from "lucide-react";

import { AccountFeedback } from "@/app/account/account-feedback";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { LogoutButton } from "@/components/dashboard/logout-button";
import { AnalysisSummaryCard } from "@/components/dashboard/analysis-summary-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Progress,
  ProgressLabel,
} from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

type PlanKey = "free" | "pro" | "lifetime";

type ProfileRow = {
  email: string | null;
  full_name: string | null;
  plan: string | null;
};

type UsageRow = {
  total_files: number | null;
};

const PLAN_LIMITS: Record<
  PlanKey,
  {
    label: string;
    monthlyFiles: number;
    maxFilesPerBatch: number;
    maxFileSizeMb: number;
    retentionDays: number;
  }
> = {
  free: {
    label: "Básico",
    monthlyFiles: 1000,
    maxFilesPerBatch: 100,
    maxFileSizeMb: 25,
    retentionDays: 7,
  },
  pro: {
    label: "Pro",
    monthlyFiles: 10000,
    maxFilesPerBatch: 100,
    maxFileSizeMb: 25,
    retentionDays: 30,
  },
  lifetime: {
    label: "Vitalício",
    monthlyFiles: 3000,
    maxFilesPerBatch: 100,
    maxFileSizeMb: 25,
    retentionDays: 30,
  },
};

function normalizePlan(plan: string | null | undefined): PlanKey {
  const normalized = plan?.toLowerCase();

  if (normalized === "pro" || normalized === "lifetime") {
    return normalized;
  }

  return "free";
}

function getMonthStartIso() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function getUsagePercent(used: number, limit: number) {
  return Math.min(100, Math.round((used / limit) * 100));
}

async function getAccountData(userId: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      profile: null,
      usageRows: [] as UsageRow[],
    };
  }

  const [profileResult, usageResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("email, full_name, plan")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("analyses")
      .select("total_files")
      .eq("user_id", userId)
      .gte("created_at", getMonthStartIso()),
  ]);

  return {
    profile: (profileResult.data ?? null) as ProfileRow | null,
    usageRows: (usageResult.data ?? []) as UsageRow[],
  };
}

export default async function AccountPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/account");
  }

  const { profile, usageRows } = await getAccountData(user.id);
  const planKey = normalizePlan(profile?.plan);
  const plan = PLAN_LIMITS[planKey];
  const monthlyFiles = usageRows.reduce(
    (total, row) => total + (row.total_files ?? 0),
    0
  );
  const remainingFiles = Math.max(0, plan.monthlyFiles - monthlyFiles);
  const usagePercent = getUsagePercent(monthlyFiles, plan.monthlyFiles);
  const fullName =
    profile?.full_name ??
    (typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : "Fotógrafo");
  const email = profile?.email ?? user.email ?? "Conta";
  const emailConfirmed = Boolean(user.email_confirmed_at);

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader email={user.email} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-5xl flex-col gap-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <h1 className="text-3xl font-semibold">Conta</h1>
                <p className="mt-2 text-muted-foreground">
                  Perfil, plano, limites e uso mensal do workspace.
                </p>
              </div>
              <Link
                href="/pricing"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
              >
                Ver planos
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <AnalysisSummaryCard
                title="Plano atual"
                value={plan.label}
                description={`Até ${formatNumber(plan.monthlyFiles)} fotos/mês`}
                icon={Sparkles}
              />
              <AnalysisSummaryCard
                title="Uso mensal"
                value={`${formatNumber(monthlyFiles)} fotos`}
                description={`${usageRows.length} análise(s) neste mês`}
                icon={Image}
              />
              <AnalysisSummaryCard
                title="Lote máximo"
                value={`${plan.maxFilesPerBatch} fotos`}
                description={`${plan.maxFileSizeMb} MB por arquivo`}
                icon={HardDrive}
              />
              <AnalysisSummaryCard
                title="Retenção"
                value={`${plan.retentionDays} dias`}
                description="Arquivos e ZIPs no Storage"
                icon={CalendarClock}
              />
            </div>
            <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
              <Card className="border-white/10 bg-white/[0.035]">
                <CardHeader>
                  <CardTitle>Perfil</CardTitle>
                  <CardDescription>Dados básicos da conta Supabase.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sky-300/10 text-sky-200">
                      <UserRound aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium">{fullName}</p>
                      <p className="break-all text-sm text-muted-foreground">
                        {email}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="grid gap-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">E-mail</span>
                      <Badge variant={emailConfirmed ? "secondary" : "outline"}>
                        <MailCheck data-icon="inline-start" />
                        {emailConfirmed ? "Confirmado" : "Pendente"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Plano</span>
                      <span className="font-medium">{plan.label}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">ID</span>
                      <span className="font-mono text-xs">{user.id.slice(0, 8)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-white/10 bg-white/[0.035]">
                <CardHeader>
                  <CardTitle>Limites do mês</CardTitle>
                  <CardDescription>
                    Ciclo atual iniciado no primeiro dia do mês.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-5">
                  <Progress value={usagePercent}>
                    <ProgressLabel>Fotos processadas</ProgressLabel>
                    <span className="ml-auto text-sm text-muted-foreground tabular-nums">
                      {usagePercent}%
                    </span>
                  </Progress>
                  <div className="grid gap-3 text-sm sm:grid-cols-2">
                    <div className="rounded-lg border border-white/10 bg-black/25 p-3">
                      <p className="text-muted-foreground">Usadas</p>
                      <p className="mt-1 text-lg font-semibold">
                        {formatNumber(monthlyFiles)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/25 p-3">
                      <p className="text-muted-foreground">Disponíveis</p>
                      <p className="mt-1 text-lg font-semibold">
                        {formatNumber(remainingFiles)}
                      </p>
                    </div>
                  </div>
                  {remainingFiles === 0 ? (
                    <Alert variant="destructive">
                      <AlertTitle>Plano sem limite disponível</AlertTitle>
                      <AlertDescription>
                        O limite mensal foi atingido. Faça upgrade ou aguarde o
                        próximo ciclo.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert>
                      <AlertTitle>Uso disponível</AlertTitle>
                      <AlertDescription>
                        Ainda há {formatNumber(remainingFiles)} fotos neste ciclo.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>
            <AccountFeedback />
            <Card className="border-white/10 bg-white/[0.035]">
              <CardHeader>
                <CardTitle>Sessão</CardTitle>
                <CardDescription>Encerrar sessão neste navegador.</CardDescription>
              </CardHeader>
              <CardContent>
                <LogoutButton />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
