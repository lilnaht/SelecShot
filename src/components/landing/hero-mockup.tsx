import { ArrowDownToLine, CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const categories = [
  { label: "Escuras", count: 74, color: "bg-zinc-800" },
  { label: "Claras", count: 39, color: "bg-sky-200" },
  { label: "Desfocadas", count: 118, color: "bg-amber-500" },
  { label: "Boas", count: 251, color: "bg-emerald-500" },
];

const strip = [
  "bg-zinc-900",
  "bg-sky-200",
  "bg-amber-800",
  "bg-emerald-900",
  "bg-violet-950",
  "bg-neutral-800",
  "bg-cyan-950",
  "bg-zinc-950",
];

export function HeroMockup() {
  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-white/10 premium-panel shadow-2xl shadow-sky-950/20">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-red-400" />
          <span className="size-2 rounded-full bg-amber-400" />
          <span className="size-2 rounded-full bg-emerald-400" />
        </div>
        <Badge variant="secondary" className="border border-white/10 bg-white/[0.04]">
          Análise finalizada
        </Badge>
      </div>
      <div className="grid gap-5 p-4 lg:grid-cols-[1.05fr_0.95fr] lg:p-6">
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-white/10 bg-black/35 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-sm text-emerald-300">
                  <CheckCircle2 aria-hidden="true" />
                  Análise finalizada
                </div>
                <p className="text-2xl font-semibold sm:text-3xl">
                  482 fotos analisadas
                </p>
              </div>
              <Button className="brand-gradient" size="lg">
                <ArrowDownToLine data-icon="inline-start" />
                <span className="hidden sm:inline">Baixar ZIP</span>
                <span className="sm:hidden">ZIP</span>
              </Button>
            </div>
          </div>
          <div className="hidden grid-cols-2 gap-3 sm:grid">
            {categories.map((category) => (
              <div
                key={category.label}
                className="rounded-lg border border-white/10 bg-white/[0.035] p-4"
              >
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className={`size-2 rounded-full ${category.color}`} />
                  {category.label}
                </div>
                <p className="mt-2 text-2xl font-semibold">{category.count}</p>
                <p className="text-xs text-muted-foreground">fotos</p>
              </div>
            ))}
          </div>
        </div>
        <div className="hidden grid-cols-4 gap-2 sm:grid">
          {Array.from({ length: 24 }, (_, index) => (
            <div
              key={index}
              className={`aspect-[4/5] rounded-md ${strip[index % strip.length]} relative overflow-hidden`}
            >
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.16),transparent_42%),radial-gradient(circle_at_35%_28%,rgba(255,255,255,0.16),transparent_28%)]" />
              <div className="absolute bottom-1 left-1 h-1 w-5 rounded-full bg-white/20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
