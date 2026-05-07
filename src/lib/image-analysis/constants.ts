export const LIMIAR_PIXEL_ESCURO = 45;
export const LIMIAR_PIXEL_CLARO = 200;
export const LIMIAR_PIXEL_MUITO_CLARO = 230;

export const LIMIAR_SOMBRA_PESADA_RATIO = 0.35;
export const LIMIAR_SOMBRA_PESADA_P25 = 40;

export const LIMIAR_LUZ_FORTE_P90 = 150;
export const LIMIAR_LUZ_FORTE_P95 = 185;

export const LIMIAR_AMBIENTE_CLARO_P50 = 95;
export const LIMIAR_AMBIENTE_CLARO_P75 = 120;

export const LIMIAR_AMBIENTE_ESCURO_P50 = 70;
export const LIMIAR_AMBIENTE_ESCURO_P75 = 105;

export const LIMIAR_DESFOQUE_FORTE = 35;
export const LIMIAR_DESFOQUE_MODERADO = 65;

export const LIMIAR_RUIDO_ISO_ALTO = 10.0;
export const LIMIAR_AREA_ESCURA_MINIMA_RUIDO = 0.12;

export const LIMIAR_SUPEREXPOSTA_RATIO = 0.08;
export const LIMIAR_SUBEXPOSTA_RATIO = 0.45;

export const PREVIEW_MAX_WIDTH = 600;
export const PREVIEW_JPEG_QUALITY = 75;
export const MAX_IMAGE_PIXELS = 50_000_000;

export const SUPPORTED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

export const SUPPORTED_IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
]);

export const IMAGE_ANALYSIS_CONCURRENCY = 3;
