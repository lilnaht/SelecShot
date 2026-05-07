import Link from "next/link";
import { Menu, Plus } from "lucide-react";

import { UserMenu } from "@/components/dashboard/user-menu";
import { SiteLogo } from "@/components/shared/site-logo";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DashboardHeaderProps = {
  email?: string | null;
};

export function DashboardHeader({ email }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-background/85 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="lg:hidden">
            <SiteLogo compact />
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu />
            <span className="sr-only">Abrir menu</span>
          </Button>
          <div className="hidden flex-col lg:flex">
            <p className="text-sm text-muted-foreground">Workspace</p>
            <p className="font-medium">SelecShot Studio</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/new-analysis"
            className={cn(
              buttonVariants({ size: "lg" }),
              "brand-gradient hidden sm:inline-flex"
            )}
          >
            <Plus data-icon="inline-start" />
            Nova análise
          </Link>
          <UserMenu email={email} />
        </div>
      </div>
    </header>
  );
}
