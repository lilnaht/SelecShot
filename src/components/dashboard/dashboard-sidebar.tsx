"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CreditCard, FolderKanban, Plus, UserRound } from "lucide-react";

import { SiteLogo } from "@/components/shared/site-logo";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/dashboard/new-analysis", label: "Nova análise", icon: Plus },
  { href: "/dashboard#recentes", label: "Análises", icon: FolderKanban },
  { href: "/pricing", label: "Planos", icon: CreditCard },
  { href: "/account", label: "Conta", icon: UserRound },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-screen w-72 shrink-0 border-r border-white/10 bg-black/30 p-4 lg:flex lg:flex-col">
      <SiteLogo className="px-2 py-2" />
      <Separator className="my-4" />
      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/dashboard"
              ? pathname === item.href
              : pathname.startsWith(item.href.replace("#recentes", ""));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground",
                active && "bg-white/[0.06] text-foreground"
              )}
            >
              <Icon aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <Link
        href="/dashboard/new-analysis"
        className={cn(buttonVariants({ size: "lg" }), "brand-gradient")}
      >
        <Plus data-icon="inline-start" />
        Nova análise
      </Link>
    </aside>
  );
}

