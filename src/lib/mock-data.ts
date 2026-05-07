import type { Analysis, AnalysisDetail, AnalysisFile, ImageCategory } from "@/lib/types";

const MOCK_USER_ID = "mock-user";
const now = new Date();

function daysAgo(days: number) {
  const date = new Date(now);
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

export const mockAnalyses: Analysis[] = [
  {
    id: "mock-analysis-1",
    user_id: MOCK_USER_ID,
    status: "done",
    total_files: 482,
    processed_files: 482,
    failed_files: 0,
    dark_count: 74,
    bright_count: 39,
    blurred_count: 118,
    good_count: 251,
    zip_path: "analyses/mock-user/mock-analysis-1/result.zip",
    zip_size_bytes: 128_400_000,
    error_message: null,
    created_at: daysAgo(1),
    processing_started_at: daysAgo(1),
    finished_at: daysAgo(1),
    processing_duration_ms: 186_000,
  },
  {
    id: "mock-analysis-2",
    user_id: MOCK_USER_ID,
    status: "processing",
    total_files: 236,
    processed_files: 0,
    failed_files: 0,
    dark_count: 0,
    bright_count: 0,
    blurred_count: 0,
    good_count: 0,
    zip_path: null,
    zip_size_bytes: null,
    error_message: null,
    created_at: daysAgo(3),
    processing_started_at: daysAgo(3),
    finished_at: null,
    processing_duration_ms: null,
  },
  {
    id: "mock-analysis-3",
    user_id: MOCK_USER_ID,
    status: "failed",
    total_files: 89,
    processed_files: 0,
    failed_files: 89,
    dark_count: 0,
    bright_count: 0,
    blurred_count: 0,
    good_count: 0,
    zip_path: null,
    zip_size_bytes: null,
    error_message: "Falha simulada ao gerar o pacote ZIP.",
    created_at: daysAgo(7),
    processing_started_at: daysAgo(7),
    finished_at: null,
    processing_duration_ms: 42_000,
  },
];

const categorySeeds: Record<ImageCategory, string[]> = {
  dark: ["bg-zinc-950", "bg-neutral-900", "bg-slate-950", "bg-stone-950"],
  bright: ["bg-sky-200", "bg-zinc-100", "bg-cyan-100", "bg-violet-100"],
  blurred: ["bg-amber-900", "bg-orange-800", "bg-zinc-800", "bg-yellow-950"],
  good: ["bg-emerald-900", "bg-sky-950", "bg-violet-950", "bg-zinc-900"],
};

export function getMockPreviewTone(category: ImageCategory, index: number) {
  return categorySeeds[category][index % categorySeeds[category].length];
}

function createFiles(category: ImageCategory, count: number): AnalysisFile[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `mock-file-${category}-${index + 1}`,
    analysis_id: "mock-analysis-1",
    user_id: MOCK_USER_ID,
    original_filename: `${category}_foto_${String(index + 1).padStart(3, "0")}.jpg`,
    storage_path: `uploads/mock-user/mock-analysis-1/originals/${category}_${index + 1}.jpg`,
    preview_path: `analyses/mock-user/mock-analysis-1/previews/${category}_${index + 1}.webp`,
    category,
    brightness_score:
      category === "dark" ? 48 : category === "bright" ? 214 : 128 + index,
    blur_score: category === "blurred" ? 62 : 180 + index * 3,
    processing_error: null,
    created_at: daysAgo(1),
  }));
}

export const mockAnalysisDetail: AnalysisDetail = {
  analysis: mockAnalyses[0],
  files: [
    ...createFiles("dark", 10),
    ...createFiles("bright", 10),
    ...createFiles("blurred", 10),
    ...createFiles("good", 10),
  ],
  zipUrl: "#",
  isMock: true,
};
