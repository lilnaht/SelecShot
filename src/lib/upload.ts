import {
  ACCEPTED_IMAGE_EXTENSIONS,
  ACCEPTED_IMAGE_TYPES,
  MAX_FILE_SIZE_BYTES,
} from "@/lib/constants";

export function isAcceptedImage(file: File) {
  return validateImageFile(file) === null;
}

export function validateImageFile(file: File): string | null {
  if (file.size <= 0) {
    return "arquivo vazio";
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `maior que ${formatBytes(MAX_FILE_SIZE_BYTES)}`;
  }

  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return "tipo de imagem não aceito";
  }

  if (!hasAcceptedImageExtension(file.name)) {
    return "extensão não aceita";
  }

  return null;
}

export function hasAcceptedImageExtension(fileName: string) {
  const normalized = fileName.toLowerCase();

  return ACCEPTED_IMAGE_EXTENSIONS.some((extension) =>
    normalized.endsWith(extension)
  );
}

export function formatBytes(bytes: number) {
  if (bytes === 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, index);

  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

export function sanitizeFileName(fileName: string) {
  const extension = getSafeExtension(fileName);
  const base = fileName
    .replace(/\.[^/.]+$/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return `${base || "foto"}.${extension}`;
}

function getSafeExtension(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";

  return ACCEPTED_IMAGE_EXTENSIONS.includes(`.${extension}`) ? extension : "jpg";
}
