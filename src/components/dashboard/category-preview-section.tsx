import { ImageOff } from "lucide-react";

import { AnalysisPreviewGrid } from "@/components/dashboard/analysis-preview-grid";
import { EmptyState } from "@/components/shared/empty-state";
import { CATEGORY_DESCRIPTIONS, CATEGORY_LABELS } from "@/lib/constants";
import type { AnalysisFileWithUrl, ImageCategory } from "@/lib/types";

type CategoryPreviewSectionProps = {
  category: ImageCategory;
  files: AnalysisFileWithUrl[];
};

export function CategoryPreviewSection({
  category,
  files,
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
        <span className="text-sm text-muted-foreground">
          {files.length} fotos
        </span>
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

