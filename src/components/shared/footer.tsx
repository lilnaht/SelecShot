import Link from "next/link";

import { SiteLogo } from "@/components/shared/site-logo";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/40">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="flex flex-col gap-3">
            <SiteLogo />
            <p className="max-w-md text-sm leading-6 text-muted-foreground">
              Organize fotos claras, escuras e desfocadas sem apagar seus
              arquivos originais.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <Link href="/pricing" className="hover:text-foreground">
              Planos
            </Link>
            <Link href="/login" className="hover:text-foreground">
              Login
            </Link>
            <Link href="/register" className="hover:text-foreground">
              Cadastro
            </Link>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} SelecShot. Triagem técnica para fluxos de
          fotografia.
        </p>
      </div>
    </footer>
  );
}

