"use client";

import { getMockPreviewTone } from "@/lib/mock-data";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
        <Dialog key={file.id}>
          <DialogTrigger
            render={
              <button
                type="button"
                className="group relative aspect-[4/5] overflow-hidden rounded-lg border border-white/10 bg-white/[0.035] text-left"
              />
            }
          >
            <PreviewImage file={file} category={category} index={index} />
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{file.original_filename}</DialogTitle>
              <DialogDescription>
                Preview ampliado da categoria tecnica selecionada.
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-hidden rounded-lg border border-white/10 bg-black">
              {file.preview_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={file.preview_url}
                  alt={file.original_filename}
                  className="max-h-[70vh] w-full object-contain"
                />
              ) : (
                <div className={`h-[55vh] ${getMockPreviewTone(category, index)}`}>
                  <div className="size-full bg-[linear-gradient(135deg,rgba(255,255,255,0.18),transparent_45%),radial-gradient(circle_at_35%_25%,rgba(255,255,255,0.14),transparent_30%)]" />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      ))}
    </div>
  );
}

function PreviewImage({
  file,
  category,
  index,
}: {
  file: AnalysisFileWithUrl;
  category: ImageCategory;
  index: number;
}) {
  return (
    <>
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
    </>
  );
}
