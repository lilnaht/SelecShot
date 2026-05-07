import Link from "next/link";

import { SiteLogo } from "@/components/shared/site-logo";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/#como-funciona", label: "Como funciona" },
  { href: "/#beneficios", label: "Benefícios" },
  { href: "/pricing", label: "Planos" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-background/82 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <SiteLogo />
        <nav className="hidden items-center gap-7 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline"
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className={cn(buttonVariants({ size: "lg" }), "brand-gradient")}
          >
            Começar agora
          </Link>
        </div>
      </div>
    </header>
  );
}

export function MobileNavbarCta() {
  return (
    <Button className="brand-gradient w-full" size="lg">
      Começar agora
    </Button>
  );
}

