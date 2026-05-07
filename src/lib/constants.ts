import type { AnalysisStatus, ImageCategory } from "@/lib/types";

export const APP_NAME = "SelecShot";
export const STORAGE_BUCKET = "framesort";

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export const ACCEPTED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

export const MAX_FILES_PER_ANALYSIS = 100;
export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;
export const MAX_TOTAL_UPLOAD_SIZE_BYTES = 500 * 1024 * 1024;

export const STATUS_LABELS: Record<AnalysisStatus, string> = {
  pending: "Pendente",
  uploading: "Enviando",
  processing: "Processando",
  done: "Finalizada",
  failed: "Falhou",
};

export const CATEGORY_LABELS: Record<ImageCategory, string> = {
  dark: "Escuras",
  bright: "Claras",
  blurred: "Desfocadas",
  good: "Boas",
};

export const CATEGORY_ZIP_FOLDERS: Record<ImageCategory, string> = {
  blurred: "blurred",
  dark: "dark",
  bright: "bright",
  good: "good",
};

export const CATEGORY_DESCRIPTIONS: Record<ImageCategory, string> = {
  dark: "Baixo brilho ou excesso de pixels escuros.",
  bright: "Exposição alta ou áreas claras demais.",
  blurred: "Baixa nitidez técnica para revisão.",
  good: "Sem alerta técnico crítico.",
};

export const CATEGORY_COLORS: Record<ImageCategory, string> = {
  dark: "text-zinc-300",
  bright: "text-sky-200",
  blurred: "text-amber-200",
  good: "text-emerald-200",
};
