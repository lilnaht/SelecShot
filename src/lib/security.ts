const SAFE_REDIRECT_PREFIXES = ["/dashboard", "/account"];
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function sanitizeRedirectPath(
  value: string | null | undefined,
  fallback = "/dashboard"
) {
  if (!value) {
    return fallback;
  }

  const trimmed = value.trim();

  if (trimmed.length > 2048 || /[\u0000-\u001f\u007f]/.test(trimmed)) {
    return fallback;
  }

  let decoded: string;

  try {
    decoded = decodeURIComponent(trimmed);
  } catch {
    return fallback;
  }

  if (
    !decoded.startsWith("/") ||
    decoded.startsWith("//") ||
    decoded.includes("\\")
  ) {
    return fallback;
  }

  const isAllowedPath = SAFE_REDIRECT_PREFIXES.some(
    (prefix) => decoded === prefix || decoded.startsWith(`${prefix}/`)
  );

  return isAllowedPath ? decoded : fallback;
}

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export function normalizeEmailInput(value: string) {
  return value.trim().toLowerCase();
}

export function sanitizeDisplayName(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

export function isValidEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isValidPassword(value: string) {
  return value.length >= 6 && value.length <= 128;
}
