import { ImageOff } from "lucide-react";
import Link from "next/link";

import { AnalysisPreviewGrid } from "@/components/dashboard/analysis-preview-grid";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { CATEGORY_DESCRIPTIONS, CATEGORY_LABELS } from "@/lib/constants";
import type { AnalysisFileWithUrl, ImageCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

type CategoryPreviewSectionProps = {
  category: ImageCategory;
  files: AnalysisFileWithUrl[];
  downloadHref?: string | null;
};

export function CategoryPreviewSection({
  category,
  files,
  downloadHref,
}: CategoryPreviewSectionProps) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/[0.025] p-4">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <h3 className="text-lg font-semibold">{CATEGORY_LABELS[category]}</h3>
          <p className="text-sm text-muted-foreground">
            {CATEGORY_DESCRIPTIONS[category]}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{files.length} fotos</span>
          {downloadHref && files.length > 0 && (
            <Link
              href={downloadHref}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Baixar categoria
            </Link>
          )}
        </div>
      </div>
      {files.length ? (
        <AnalysisPreviewGrid files={files} category={category} />
      ) : (
        <EmptyState
          icon={ImageOff}
          title="Nenhuma foto nesta categoria"
          description="Quando o worker classificar o lote, os previews aparecem aqui."
        />
      )}
    </section>
  );
}
