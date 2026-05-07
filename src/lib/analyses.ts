import { STORAGE_BUCKET } from "@/lib/constants";
import { mockAnalyses, mockAnalysisDetail } from "@/lib/mock-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Analysis, AnalysisDetail, AnalysisFile } from "@/lib/types";

export async function getAnalysesForUser(userId: string): Promise<Analysis[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return mockAnalyses.map((analysis) => ({ ...analysis, user_id: userId }));
  }

  const { data, error } = await supabase
    .from("analyses")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(12);

  if (error || !data?.length) {
    return mockAnalyses.map((analysis) => ({ ...analysis, user_id: userId }));
  }

  return data as Analysis[];
}

export async function getAnalysisDetail(
  userId: string,
  analysisId: string
): Promise<AnalysisDetail | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase || analysisId.startsWith("mock")) {
    return withUser(mockAnalysisDetail, userId);
  }

  const { data: analysis, error: analysisError } = await supabase
    .from("analyses")
    .select("*")
    .eq("id", analysisId)
    .eq("user_id", userId)
    .single();

  if (analysisError || !analysis) {
    return null;
  }

  const { data: files } = await supabase
    .from("analysis_files")
    .select("*")
    .eq("analysis_id", analysisId)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  const signedFiles = await Promise.all(
    ((files ?? []) as AnalysisFile[]).map(async (file) => {
      if (!file.preview_path) {
        return { ...file, preview_url: null };
      }

      const { data } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(file.preview_path, 60 * 10);

      return { ...file, preview_url: data?.signedUrl ?? null };
    })
  );

  let zipUrl: string | null = null;

  if ((analysis as Analysis).zip_path) {
    const { data } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl((analysis as Analysis).zip_path!, 60 * 10);

    zipUrl = data?.signedUrl ?? null;
  }

  return {
    analysis: analysis as Analysis,
    files: signedFiles,
    zipUrl,
  };
}

export function getDashboardStats(analyses: Analysis[]) {
  const monthlyFiles = analyses.reduce(
    (total, analysis) => total + analysis.total_files,
    0
  );

  return {
    totalAnalyses: analyses.length,
    monthlyFiles,
    plan: "Pro",
    lastAnalysis: analyses[0] ?? null,
  };
}

function withUser(detail: AnalysisDetail, userId: string): AnalysisDetail {
  return {
    ...detail,
    analysis: { ...detail.analysis, user_id: userId },
    files: detail.files.map((file) => ({ ...file, user_id: userId })),
  };
}

