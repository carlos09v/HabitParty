/**
 * Utilitários compartilhados para persistência e leitura da visibilidade
 * de colunas do quadro Kanban por workspace (Cookie SSR consolidado + localStorage).
 */

export const VISIBLE_COLUMNS_MAP_COOKIE_NAME = "hp_visible_cols_v2";
const MAX_STORED_WORKSPACE_ENTRIES = 20;

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

export function parseVisibleColumnsMapCookie(
  rawValue: string | undefined,
): Record<string, string[]> {
  if (!rawValue) return {};
  try {
    const parsed = JSON.parse(decodeURIComponent(rawValue));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    const result: Record<string, string[]> = {};
    for (const [wsId, ids] of Object.entries(parsed)) {
      if (typeof wsId === "string" && Array.isArray(ids)) {
        result[wsId] = ids.filter((id): id is string => typeof id === "string");
      }
    }
    return result;
  } catch {
    return {};
  }
}

export function readVisibleColumnsFromCookieStore(
  cookieStore: { get: (name: string) => { value: string } | undefined },
  workspaceId: string | null | undefined,
): string[] | undefined {
  if (!workspaceId) return undefined;
  const mapVal = cookieStore.get(VISIBLE_COLUMNS_MAP_COOKIE_NAME)?.value;
  if (mapVal) {
    const map = parseVisibleColumnsMapCookie(mapVal);
    if (Array.isArray(map[workspaceId])) {
      return map[workspaceId];
    }
  }
  const legacyVal = cookieStore.get(
    getVisibleColumnsCookieName(workspaceId),
  )?.value;
  return parseVisibleColumnsCookie(legacyVal);
}

function readBrowserCookieValue(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const prefix = `${name}=`;
  const cookies = document.cookie.split(";");
  for (const part of cookies) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      return trimmed.slice(prefix.length);
    }
  }
  return undefined;
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
    const currentMap = parseVisibleColumnsMapCookie(
      readBrowserCookieValue(VISIBLE_COLUMNS_MAP_COOKIE_NAME),
    );
    // Reinsere a chave no fim para política LRU e limita a MAX_STORED_WORKSPACE_ENTRIES
    delete currentMap[workspaceId];
    currentMap[workspaceId] = ids;
    const entries = Object.entries(currentMap);
    const trimmedMap =
      entries.length > MAX_STORED_WORKSPACE_ENTRIES
        ? Object.fromEntries(entries.slice(-MAX_STORED_WORKSPACE_ENTRIES))
        : currentMap;

    // biome-ignore lint/suspicious/noDocumentCookie: Consolida colunas visíveis em um único cookie compacto
    document.cookie = `${VISIBLE_COLUMNS_MAP_COOKIE_NAME}=${encodeURIComponent(
      JSON.stringify(trimmedMap),
    )}; path=/; max-age=31536000; SameSite=Lax`;

    // Expira eventual cookie legado por workspace para enxugar headers HTTP
    // biome-ignore lint/suspicious/noDocumentCookie: Limpeza progressiva do cookie legado por workspace
    document.cookie = `${getVisibleColumnsCookieName(workspaceId)}=; path=/; max-age=0; SameSite=Lax`;
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
  maxAllowed?: number,
): string[] | null {
  if (!workspaceId) return null;
  const current = readVisibleColumnsStorage(workspaceId) ?? fallbackIds ?? null;
  if (!current || !current.includes(columnId)) {
    return current;
  }
  const remainingSet = remainingColumnIds ? new Set(remainingColumnIds) : null;
  const next = current.filter(
    (id) => id !== columnId && (!remainingSet || remainingSet.has(id)),
  );
  if (remainingColumnIds && remainingColumnIds.length > 0) {
    const targetCount =
      maxAllowed !== undefined
        ? Math.min(remainingColumnIds.length, maxAllowed)
        : next.length === 0
          ? 1
          : next.length;
    for (const candidateId of remainingColumnIds) {
      if (next.length >= targetCount) break;
      if (!next.includes(candidateId)) {
        next.push(candidateId);
      }
    }
  }
  persistVisibleColumnsClient(workspaceId, next);
  return next;
}
