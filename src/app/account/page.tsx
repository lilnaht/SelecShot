import { redirect } from "next/navigation";
import { UserRound } from "lucide-react";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { LogoutButton } from "@/components/dashboard/logout-button";
import { AnalysisSummaryCard } from "@/components/dashboard/analysis-summary-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/supabase/server";

export default async function AccountPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/account");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader email={user.email} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-4xl flex-col gap-6">
            <div>
              <h1 className="text-3xl font-semibold">Conta</h1>
              <p className="mt-2 text-muted-foreground">
                Gerencie seu acesso e plano atual.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <AnalysisSummaryCard
                title="Plano atual"
                value="Pro"
                description="UI de cobrança preparada, sem pagamento real."
                icon={UserRound}
              />
              <AnalysisSummaryCard
                title="E-mail"
                value={user.email ?? "Conta"}
                description="Autenticação via Supabase Auth."
                icon={UserRound}
              />
            </div>
            <Card className="border-white/10 bg-white/[0.035]">
              <CardHeader>
                <CardTitle>Sessão</CardTitle>
                <CardDescription>
                  Encerrar sessão neste navegador.
                </CardDescription>
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

