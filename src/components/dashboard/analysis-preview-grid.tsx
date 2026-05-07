import { getMockPreviewTone } from "@/lib/mock-data";
import type { AnalysisFileWithUrl, ImageCategory } from "@/lib/types";

type AnalysisPreviewGridProps = {
  files: AnalysisFileWithUrl[];
  category: ImageCategory;
};

export function AnalysisPreviewGrid({
  files,
  category,
}: AnalysisPreviewGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      {files.slice(0, 10).map((file, index) => (
        <div
          key={file.id}
          className="group relative aspect-[4/5] overflow-hidden rounded-lg border border-white/10 bg-white/[0.035]"
        >
          {file.preview_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={file.preview_url}
              alt={file.original_filename}
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className={`size-full ${getMockPreviewTone(category, index)}`}>
              <div className="size-full bg-[linear-gradient(135deg,rgba(255,255,255,0.18),transparent_45%),radial-gradient(circle_at_35%_25%,rgba(255,255,255,0.14),transparent_30%)]" />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
            <p className="truncate text-xs text-white/85">{file.original_filename}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

