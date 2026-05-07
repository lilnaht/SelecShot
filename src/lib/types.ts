export type AnalysisStatus =
  | "pending"
  | "uploading"
  | "processing"
  | "done"
  | "failed";

export type ImageCategory = "dark" | "bright" | "blurred" | "good";

export type Analysis = {
  id: string;
  user_id: string;
  status: AnalysisStatus;
  total_files: number;
  processed_files: number;
  failed_files: number;
  dark_count: number;
  bright_count: number;
  blurred_count: number;
  good_count: number;
  zip_path: string | null;
  zip_size_bytes: number | null;
  error_message: string | null;
  created_at: string;
  processing_started_at: string | null;
  finished_at: string | null;
  processing_duration_ms: number | null;
};

export type AnalysisFile = {
  id: string;
  analysis_id: string;
  user_id: string;
  original_filename: string;
  storage_path: string;
  preview_path: string | null;
  category: ImageCategory | null;
  brightness_score: number | null;
  blur_score: number | null;
  processing_error: string | null;
  created_at: string;
};

export type AnalysisFileWithUrl = AnalysisFile & {
  preview_url?: string | null;
};

export type AnalysisDetail = {
  analysis: Analysis;
  files: AnalysisFileWithUrl[];
  zipUrl: string | null;
  isMock?: boolean;
};

export type DashboardStats = {
  totalAnalyses: number;
  monthlyFiles: number;
  plan: string;
  lastAnalysis: Analysis | null;
};
