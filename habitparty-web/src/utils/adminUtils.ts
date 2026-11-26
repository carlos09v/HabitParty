import {
  FREE_USER_STORAGE_LIMIT_BYTES,
  PREMIUM_USER_STORAGE_LIMIT_BYTES,
} from "@/constants/admin";

/** Retorna a cota máxima em bytes de acordo com o plano do usuário */
export function getUserStorageLimitBytes(isPremium: boolean): number {
  return isPremium
    ? PREMIUM_USER_STORAGE_LIMIT_BYTES
    : FREE_USER_STORAGE_LIMIT_BYTES;
}

/** Retorna o limite formatado (ex: "5 MB" ou "50 MB") */
export function getUserStorageLimitFormatted(isPremium: boolean): string {
  return isPremium ? "50 MB" : "5 MB";
}

/** Calcula a porcentagem utilizada da cota (0% a 100%) */
export function calculateStoragePercentage(
  bytesUsed: number,
  isPremium: boolean,
): number {
  const limit = getUserStorageLimitBytes(isPremium);
  if (limit <= 0) return 0;
  const pct = (bytesUsed / limit) * 100;
  return Math.min(Math.round(pct * 10) / 10, 100);
}

/** Formata bytes em B, KB ou MB (espelhando UserStorageBreakdownProjection.formatBytes do backend) */
export function formatStorageBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export interface BuildAdminUsersUrlOptions {
  basePath?: string;
  currentParams?: string;
  search?: string;
  filter?: string;
  page?: number;
}

/**
 * Constrói a URL canônica da listagem administrativa (`/admin`) omitindo valores padrão
 * (`filter=ALL`, `page=1`, `search=""`) para manter a barra de endereços limpa.
 */
export function buildAdminUsersUrl({
  basePath = "/admin",
  currentParams,
  search,
  filter,
  page,
}: BuildAdminUsersUrlOptions): string {
  const params = new URLSearchParams(currentParams ?? "");

  if (search !== undefined) {
    const trimmed = search.trim();
    if (trimmed) {
      params.set("search", trimmed);
    } else {
      params.delete("search");
    }
  }

  if (filter !== undefined) {
    if (filter && filter !== "ALL") {
      params.set("filter", filter);
    } else {
      params.delete("filter");
    }
  }

  if (page !== undefined) {
    if (page > 1) {
      params.set("page", String(page));
    } else {
      params.delete("page");
    }
  }

  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}
