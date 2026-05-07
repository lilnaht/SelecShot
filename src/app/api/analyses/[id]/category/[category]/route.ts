import { Buffer } from "node:buffer";
import { type NextRequest, NextResponse } from "next/server";

import { CATEGORY_LABELS, STORAGE_BUCKET } from "@/lib/constants";
import {
  buildAnalysisZip,
  type ZipImageFile,
  type ZipReportRow,
} from "@/lib/image-analysis/zip";
import { isUuid } from "@/lib/security";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import type { ImageCategory } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const categories = new Set<ImageCategory>(["dark", "bright", "blurred", "good"]);

type CategoryRouteParams = {
  params: Promise<{
    id: string;
    category: string;
  }>;
};

type CategoryFileRow = {
  original_filename: string | null;
  storage_path: string | null;
  category: ImageCategory | null;
  brightness_score: number | null;
  blur_score: number | null;
};

export async function GET(_request: NextRequest, context: CategoryRouteParams) {
  const { id, category } = await context.params;

  if (!isUuid(id) || !isImageCategory(category)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();

  if (!user || !supabase) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: analysis, error: analysisError } = await supabase
    .from("analyses")
    .select("id,status")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (analysisError || !analysis || analysis.status !== "done") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: files, error: filesError } = await supabase
    .from("analysis_files")
    .select("original_filename,storage_path,category,brightness_score,blur_score")
    .eq("analysis_id", id)
    .eq("user_id", user.id)
    .eq("category", category)
    .order("created_at", { ascending: true });

  if (filesError || !files?.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const zipFiles: ZipImageFile[] = (files as CategoryFileRow[])
    .filter((file) => file.storage_path)
    .map((file) => ({
      category,
      originalFilename: file.original_filename ?? `${category}.jpg`,
      storagePath: file.storage_path!,
    }));

  const reportRows: ZipReportRow[] = (files as CategoryFileRow[]).map((file) => ({
    arquivo: file.original_filename ?? `${category}.jpg`,
    categoria: category,
    brilho_medio: file.brightness_score,
    proporcao_escuros: null,
    proporcao_claros: null,
    blur_score: file.blur_score,
  }));

  const zipBuffer = await buildAnalysisZip({
    files: zipFiles,
    reportRows,
    loadFileBuffer: async (file) => {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .download(file.storagePath);

      if (error || !data) {
        throw error ?? new Error("Storage object not found");
      }

      return Buffer.from(await data.arrayBuffer());
    },
  });

  return new Response(new Uint8Array(zipBuffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${safeDownloadName(
        CATEGORY_LABELS[category]
      )}-${id.slice(0, 8)}.zip"`,
      "Cache-Control": "private, no-store",
    },
  });
}

function isImageCategory(value: string): value is ImageCategory {
  return categories.has(value as ImageCategory);
}

function safeDownloadName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}
