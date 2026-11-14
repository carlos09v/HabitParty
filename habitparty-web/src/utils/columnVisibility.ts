/**
 * Utilitários compartilhados para persistência e leitura da visibilidade
 * de colunas do quadro Kanban por workspace (Cookie SSR + localStorage).
 */

export function getVisibleColumnsCookieName(workspaceId: string): string {
  return `hp_visible_cols_${workspaceId}`;
}

export function getVisibleColumnsStorageKey(workspaceId: string): string {
  return `habitparty_visible_columns_${workspaceId}`;
}

export function parseVisibleColumnsCookie(
  rawValue: string | undefined,
): string[] | undefined {
  if (!rawValue) return undefined;
  try {
    const parsed = JSON.parse(decodeURIComponent(rawValue));
    if (!Array.isArray(parsed)) return undefined;
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return undefined;
  }
}

export function readVisibleColumnsStorage(
  workspaceId: string | null | undefined,
): string[] | null {
  if (!workspaceId || typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(getVisibleColumnsStorageKey(workspaceId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return null;
  }
}

export function persistVisibleColumnsClient(
  workspaceId: string | null | undefined,
  ids: string[],
): void {
  if (!workspaceId || typeof window === "undefined") return;
  try {
    localStorage.setItem(
      getVisibleColumnsStorageKey(workspaceId),
      JSON.stringify(ids),
    );
  } catch {
    // localStorage indisponível ou bloqueado
  }
  try {
    // biome-ignore lint/suspicious/noDocumentCookie: Persiste colunas visíveis por workspace no cliente
    document.cookie = `${getVisibleColumnsCookieName(workspaceId)}=${encodeURIComponent(
      JSON.stringify(ids),
    )}; path=/; max-age=31536000; SameSite=Lax`;
  } catch {
    // falha silenciosa em ambientes restritos
  }
}

export function appendVisibleColumnIfSpaceAllows(
  workspaceId: string | null | undefined,
  columnId: string,
  maxAllowed: number,
  fallbackIds?: string[] | null,
): string[] | null {
  if (!workspaceId) return null;
  const current = readVisibleColumnsStorage(workspaceId) ?? fallbackIds ?? null;
  if (!current) return null;
  if (current.includes(columnId) || current.length >= maxAllowed) {
    return current;
  }
  const next = [...current, columnId];
  persistVisibleColumnsClient(workspaceId, next);
  return next;
}

export function removeVisibleColumnIfPresent(
  workspaceId: string | null | undefined,
  columnId: string,
  remainingColumnIds?: string[],
  fallbackIds?: string[] | null,
): string[] | null {
  if (!workspaceId) return null;
  const current = readVisibleColumnsStorage(workspaceId) ?? fallbackIds ?? null;
  if (!current || !current.includes(columnId)) {
    return current;
  }
  let next = current.filter((id) => id !== columnId);
  if (
    next.length === 0 &&
    remainingColumnIds &&
    remainingColumnIds.length > 0
  ) {
    next = [remainingColumnIds[0]];
  }
  persistVisibleColumnsClient(workspaceId, next);
  return next;
}
