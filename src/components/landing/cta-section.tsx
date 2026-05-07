import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CTASection() {
  return (
    <section className="px-4 pb-20 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 rounded-xl border border-white/10 premium-panel p-8 md:flex-row md:items-center lg:p-10">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold sm:text-4xl">
            Envie, analise e baixe tudo organizado.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Revise menos arquivos manualmente e preserve seus originais.
          </p>
        </div>
        <Link
          href="/register"
          className={cn(buttonVariants({ size: "lg" }), "brand-gradient")}
        >
          Começar agora
          <ArrowRight data-icon="inline-end" />
        </Link>
      </div>
    </section>
  );
}

