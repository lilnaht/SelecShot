import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

import { HeroMockup } from "@/components/landing/hero-mockup";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid min-h-[calc(86vh-4rem)] w-full max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[0.88fr_1.12fr] lg:gap-12 lg:px-8 lg:py-16">
        <div className="flex flex-col gap-6 sm:gap-8">
          <div className="flex flex-col gap-5">
            <h1 className="max-w-3xl text-balance text-4xl font-semibold leading-[1.06] text-foreground sm:text-6xl lg:text-7xl">
              Separe fotos ruins em minutos.
            </h1>
            <p className="max-w-xl text-lg leading-8 text-muted-foreground">
              Envie suas imagens e receba um pacote organizado com fotos claras,
              escuras e desfocadas — pronto para baixar.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className={cn(buttonVariants({ size: "lg" }), "brand-gradient")}
            >
              Começar agora
              <ArrowRight data-icon="inline-end" />
            </Link>
            <Link
              href="/pricing"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              Ver planos
            </Link>
          </div>
          <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <ShieldCheck aria-hidden="true" className="text-emerald-300" />
              Suas fotos originais são preservadas.
            </div>
            <div className="flex items-center gap-2">
              <Sparkles aria-hidden="true" className="text-sky-300" />
              Menos tempo filtrando. Mais tempo editando.
            </div>
          </div>
        </div>
        <HeroMockup />
      </div>
    </section>
  );
}
