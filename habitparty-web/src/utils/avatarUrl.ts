const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const API_ORIGIN_HOST = (() => {
  try {
    return new URL(API_BASE_URL).hostname;
  } catch {
    return null;
  }
})();

/**
 * Resolve URLs relativas vindas do backend (ex: "/uploads/uuid.png")
 * para o endereço completo do servidor da API, preservando URLs absolutas e blobs.
 */
export function resolveAvatarSrc(src?: string | null): string | null {
  if (!src) return null;
  const trimmed = src.trim();
  if (!trimmed) return null;
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }
  if (trimmed.startsWith("/uploads/")) {
    return `${API_BASE_URL.replace(/\/$/, "")}${trimmed}`;
  }
  return trimmed;
}
