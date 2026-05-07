import { Buffer } from "node:buffer";
import type { SupabaseClient } from "@supabase/supabase-js";

import { STORAGE_BUCKET } from "@/lib/constants";
import {
  IMAGE_ANALYSIS_CONCURRENCY,
  SUPPORTED_IMAGE_EXTENSIONS,
} from "@/lib/image-analysis/constants";
import { analyzeImageDetailed } from "@/lib/image-analysis/analyze-image";
import { generatePreview } from "@/lib/image-analysis/preview";
import {
  buildAnalysisZip,
  type ZipImageFile,
  type ZipReportRow,
} from "@/lib/image-analysis/zip";
import type { ImageAnalysisResult, ImageCategory } from "@/lib/image-analysis/types";
import type { AnalysisStatus } from "@/lib/types";

type AnalysisRow = {
  id: string;
  user_id: string;
  status: AnalysisStatus;
};

type AnalysisFileRow = {
  id: string;
  analysis_id: string;
  user_id: string;
  original_filename: string | null;
  storage_path: string | null;
};

type SuccessfulFileResult = {
  status: "success";
  fileId: string;
  filename: string;
  storagePath: string;
  analysis: ImageAnalysisResult;
  reportRow: ZipReportRow;
};

type FailedFileResult = {
  status: "error";
  fileId: string;
  filename: string;
  error: string;
  reportRow: ZipReportRow;
};

type FileProcessResult = SuccessfulFileResult | FailedFileResult;

export type ProcessSupabaseAnalysisResult = {
  status: "processed" | "skipped";
  analysisId: string;
  totalFiles: number;
  processedFiles: number;
  failedFiles: number;
  zipPath: string | null;
  errors: Array<{
    fileId: string;
    filename: string;
    error: string;
  }>;
};

type ProcessSupabaseAnalysisOptions = {
  supabase: SupabaseClient;
  analysisId: string;
  userId: string;
  concurrency?: number;
};

export async function processSupabaseAnalysis({
  supabase,
  analysisId,
  userId,
  concurrency = IMAGE_ANALYSIS_CONCURRENCY,
}: ProcessSupabaseAnalysisOptions): Promise<ProcessSupabaseAnalysisResult> {
  try {
    const claimed = await claimAnalysis(supabase, analysisId, userId);

    if (!claimed) {
      const current = await fetchAnalysis(supabase, analysisId, userId);

      return {
        status: "skipped",
        analysisId,
        totalFiles: 0,
        processedFiles: 0,
        failedFiles: 0,
        zipPath: current?.status === "done" ? null : null,
        errors: [],
      };
    }

    const files = await fetchAnalysisFiles(supabase, analysisId, userId);
    const results = await mapWithConcurrency(files, concurrency, (file) =>
      processAnalysisFile(supabase, file)
    );

    const successfulResults = results.filter(
      (result): result is SuccessfulFileResult => result.status === "success"
    );
    const failedResults = results.filter(
      (result): result is FailedFileResult => result.status === "error"
    );
    const zipFiles: ZipImageFile[] = successfulResults.map((result) => ({
      category: result.analysis.category,
      originalFilename: result.filename,
      storagePath: result.storagePath,
    }));
    const reportRows = results.map((result) => result.reportRow);
    const zipBuffer = await buildAnalysisZip({
      files: zipFiles,
      reportRows,
      loadFileBuffer: (file) => downloadStorageBuffer(supabase, file.storagePath),
    });
    const zipPath = `analyses/${userId}/${analysisId}/result.zip`;

    await uploadStorageBuffer(supabase, zipPath, zipBuffer, "application/zip");
    await markDone({
      supabase,
      analysisId,
      userId,
      totalFiles: files.length,
      counts: countCategories(successfulResults),
      zipPath,
    });

    return {
      status: "processed",
      analysisId,
      totalFiles: files.length,
      processedFiles: successfulResults.length,
      failedFiles: failedResults.length,
      zipPath,
      errors: failedResults.map((result) => ({
        fileId: result.fileId,
        filename: result.filename,
        error: result.error,
      })),
    };
  } catch (error) {
    await markFailed(supabase, analysisId, userId, toErrorMessage(error));
    throw error;
  }
}

async function processAnalysisFile(
  supabase: SupabaseClient,
  file: AnalysisFileRow
): Promise<FileProcessResult> {
  const fileId = file.id;
  const filename = file.original_filename || `${fileId}.jpg`;
  const storagePath = file.storage_path;

  try {
    if (!storagePath) {
      throw new Error("Arquivo sem caminho no Storage.");
    }

    if (!hasSupportedImageExtension(filename) && !hasSupportedImageExtension(storagePath)) {
      throw new Error("Formato nao suportado. Use jpg, jpeg, png ou webp.");
    }

    const originalBuffer = await downloadStorageBuffer(supabase, storagePath);
    const [analysis, previewBuffer] = await Promise.all([
      analyzeImageDetailed(originalBuffer),
      generatePreview(originalBuffer),
    ]);
    const previewPath = `analyses/${file.user_id}/${file.analysis_id}/previews/${fileId}.jpg`;

    await uploadStorageBuffer(supabase, previewPath, previewBuffer, "image/jpeg");
    await updateFileAsProcessed(supabase, file, analysis, previewPath);

    return {
      status: "success",
      fileId,
      filename,
      storagePath,
      analysis,
      reportRow: {
        arquivo: filename,
        categoria: analysis.category,
        brilho_medio: analysis.brightnessMean,
        proporcao_escuros: analysis.darkRatio,
        proporcao_claros: analysis.brightRatio,
        blur_score: analysis.blurScore,
      },
    };
  } catch (error) {
    const message = toErrorMessage(error);
    await updateFileAsInvalid(supabase, file);

    return {
      status: "error",
      fileId,
      filename,
      error: message,
      reportRow: {
        arquivo: filename,
        categoria: "invalid",
        brilho_medio: null,
        proporcao_escuros: null,
        proporcao_claros: null,
        blur_score: null,
      },
    };
  }
}

async function claimAnalysis(
  supabase: SupabaseClient,
  analysisId: string,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("analyses")
    .update({
      status: "processing",
      error_message: null,
      finished_at: null,
    })
    .eq("id", analysisId)
    .eq("user_id", userId)
    .in("status", ["pending", "uploading"])
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data);
}

async function fetchAnalysis(
  supabase: SupabaseClient,
  analysisId: string,
  userId: string
): Promise<AnalysisRow | null> {
  const { data, error } = await supabase
    .from("analyses")
    .select("id,user_id,status")
    .eq("id", analysisId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as AnalysisRow | null) ?? null;
}

async function fetchAnalysisFiles(
  supabase: SupabaseClient,
  analysisId: string,
  userId: string
): Promise<AnalysisFileRow[]> {
  const { data, error } = await supabase
    .from("analysis_files")
    .select("id,analysis_id,user_id,original_filename,storage_path")
    .eq("analysis_id", analysisId)
    .eq("user_id", userId)
    .order("created_at");

  if (error) {
    throw error;
  }

  return (data as AnalysisFileRow[] | null) ?? [];
}

async function updateFileAsProcessed(
  supabase: SupabaseClient,
  file: AnalysisFileRow,
  analysis: ImageAnalysisResult,
  previewPath: string
): Promise<void> {
  const { error } = await supabase
    .from("analysis_files")
    .update({
      category: analysis.category,
      brightness_score: analysis.brightnessMean,
      blur_score: analysis.blurScore,
      preview_path: previewPath,
    })
    .eq("id", file.id)
    .eq("user_id", file.user_id);

  if (error) {
    throw error;
  }
}

async function updateFileAsInvalid(
  supabase: SupabaseClient,
  file: AnalysisFileRow
): Promise<void> {
  const { error } = await supabase
    .from("analysis_files")
    .update({
      category: null,
      brightness_score: null,
      blur_score: null,
      preview_path: null,
    })
    .eq("id", file.id)
    .eq("user_id", file.user_id);

  if (error) {
    throw error;
  }
}

async function markDone({
  supabase,
  analysisId,
  userId,
  totalFiles,
  counts,
  zipPath,
}: {
  supabase: SupabaseClient;
  analysisId: string;
  userId: string;
  totalFiles: number;
  counts: Record<ImageCategory, number>;
  zipPath: string;
}): Promise<void> {
  const { error } = await supabase
    .from("analyses")
    .update({
      status: "done",
      total_files: totalFiles,
      dark_count: counts.dark,
      bright_count: counts.bright,
      blurred_count: counts.blurred,
      good_count: counts.good,
      zip_path: zipPath,
      error_message: null,
      finished_at: new Date().toISOString(),
    })
    .eq("id", analysisId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}

async function markFailed(
  supabase: SupabaseClient,
  analysisId: string,
  userId: string,
  errorMessage: string
): Promise<void> {
  await supabase
    .from("analyses")
    .update({
      status: "failed",
      error_message: errorMessage.slice(0, 1000),
      finished_at: new Date().toISOString(),
    })
    .eq("id", analysisId)
    .eq("user_id", userId);
}

async function downloadStorageBuffer(
  supabase: SupabaseClient,
  storagePath: string
): Promise<Buffer> {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .download(storagePath);

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(`Storage object not found: ${storagePath}`);
  }

  if (Buffer.isBuffer(data)) {
    return data;
  }

  if (data instanceof ArrayBuffer) {
    return Buffer.from(data);
  }

  if (ArrayBuffer.isView(data)) {
    return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
  }

  if (typeof Blob !== "undefined" && data instanceof Blob) {
    return Buffer.from(await data.arrayBuffer());
  }

  if (typeof data === "object" && "arrayBuffer" in data) {
    return Buffer.from(await data.arrayBuffer());
  }

  throw new TypeError(`Unexpected storage payload for ${storagePath}.`);
}

async function uploadStorageBuffer(
  supabase: SupabaseClient,
  storagePath: string,
  buffer: Buffer,
  contentType: string
): Promise<void> {
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(storagePath, buffer, {
    cacheControl: "3600",
    contentType,
    upsert: true,
  });

  if (error) {
    throw error;
  }
}

function countCategories(results: SuccessfulFileResult[]): Record<ImageCategory, number> {
  const counts: Record<ImageCategory, number> = {
    blurred: 0,
    dark: 0,
    bright: 0,
    good: 0,
  };

  for (const result of results) {
    counts[result.analysis.category] += 1;
  }

  return counts;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const limit = Math.max(1, Math.min(concurrency, items.length || 1));
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  await Promise.all(
    Array.from({ length: limit }, async () => {
      while (nextIndex < items.length) {
        const currentIndex = nextIndex;
        nextIndex += 1;
        results[currentIndex] = await mapper(items[currentIndex] as T, currentIndex);
      }
    })
  );

  return results;
}

function hasSupportedImageExtension(value: string): boolean {
  const normalized = value.toLowerCase();

  return Array.from(SUPPORTED_IMAGE_EXTENSIONS).some((extension) =>
    normalized.endsWith(extension)
  );
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
