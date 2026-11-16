"use client";

export interface NavigationTrailState {
  urls: string[];
  index: number;
}

interface BrowserNavigationEntry {
  url?: string | null;
}

interface BrowserNavigationApi {
  currentEntry?: {
    index?: number;
  } | null;
  entries?: () => BrowserNavigationEntry[];
}

const NAV_TRAIL_STORAGE_KEY = "hp_nav_trail";
const MAX_TRAIL_LENGTH = 30;
export const NAV_TRAIL_EVENT = "hp:nav-trail-updated";

function parseSameOriginPath(rawUrl: string | null | undefined): string | null {
  if (!rawUrl || typeof window === "undefined") return null;
  try {
    const parsed = new URL(rawUrl, window.location.origin);
    if (parsed.origin !== window.location.origin) return null;
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return null;
  }
}

function readTrail(): NavigationTrailState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(NAV_TRAIL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<NavigationTrailState>;
    if (
      !Array.isArray(parsed.urls) ||
      typeof parsed.index !== "number" ||
      parsed.index < 0 ||
      parsed.index >= parsed.urls.length
    ) {
      return null;
    }
    return {
      urls: parsed.urls.filter((u): u is string => typeof u === "string"),
      index: parsed.index,
    };
  } catch {
    return null;
  }
}

function writeTrail(state: NavigationTrailState): void {
  if (typeof window === "undefined") return;
  try {
    const trimmedUrls = state.urls.slice(-MAX_TRAIL_LENGTH);
    const trimmedCount = state.urls.length - trimmedUrls.length;
    const adjustedIndex = Math.max(
      0,
      Math.min(trimmedUrls.length - 1, state.index - trimmedCount),
    );
    window.sessionStorage.setItem(
      NAV_TRAIL_STORAGE_KEY,
      JSON.stringify({ urls: trimmedUrls, index: adjustedIndex }),
    );
    window.dispatchEvent(new CustomEvent(NAV_TRAIL_EVENT));
  } catch {
    // Ignora falhas de acesso ao sessionStorage
  }
}

export function syncInitialNavigationTrail(currentUrl: string): void {
  const existing = readTrail();
  if (existing) {
    if (existing.urls[existing.index] === currentUrl) {
      return;
    }
    if (
      existing.index > 0 &&
      existing.urls[existing.index - 1] === currentUrl
    ) {
      writeTrail({ urls: existing.urls, index: existing.index - 1 });
      return;
    }
    const nextUrls = [
      ...existing.urls.slice(0, existing.index + 1),
      currentUrl,
    ];
    writeTrail({ urls: nextUrls, index: nextUrls.length - 1 });
    return;
  }

  const referrerPath =
    typeof document !== "undefined"
      ? parseSameOriginPath(document.referrer)
      : null;

  if (referrerPath && referrerPath !== currentUrl) {
    writeTrail({ urls: [referrerPath, currentUrl], index: 1 });
    return;
  }

  writeTrail({ urls: [currentUrl], index: 0 });
}

export function recordNavigationTrailPush(currentUrl: string): void {
  const existing = readTrail();
  if (!existing) {
    syncInitialNavigationTrail(currentUrl);
    return;
  }

  if (existing.urls[existing.index] === currentUrl) {
    return;
  }

  const nextUrls = [...existing.urls.slice(0, existing.index + 1), currentUrl];
  writeTrail({ urls: nextUrls, index: nextUrls.length - 1 });
}

export function syncNavigationTrailPop(currentUrl: string): void {
  const existing = readTrail();
  if (!existing) {
    writeTrail({ urls: [currentUrl], index: 0 });
    return;
  }

  if (existing.index > 0 && existing.urls[existing.index - 1] === currentUrl) {
    writeTrail({ urls: existing.urls, index: existing.index - 1 });
    return;
  }

  if (
    existing.index + 1 < existing.urls.length &&
    existing.urls[existing.index + 1] === currentUrl
  ) {
    writeTrail({ urls: existing.urls, index: existing.index + 1 });
    return;
  }

  const matchedIndex = existing.urls.lastIndexOf(currentUrl);
  if (matchedIndex >= 0) {
    writeTrail({ urls: existing.urls, index: matchedIndex });
  }
}

export function canNavigateBackInApp(): boolean {
  if (typeof window === "undefined") return false;
  if (window.history.length <= 1) return false;

  const currentUrl = `${window.location.pathname}${window.location.search}`;
  const navApi = (window as Window & { navigation?: BrowserNavigationApi })
    .navigation;

  if (
    navApi?.currentEntry &&
    typeof navApi.currentEntry.index === "number" &&
    typeof navApi.entries === "function"
  ) {
    const idx = navApi.currentEntry.index;
    if (idx <= 0) return false;
    const entries = navApi.entries();
    const prevPath = parseSameOriginPath(entries[idx - 1]?.url);
    return Boolean(prevPath && prevPath !== currentUrl);
  }

  const trail = readTrail();
  if (trail && trail.index > 0) {
    const prevUrl = trail.urls[trail.index - 1];
    return Boolean(prevUrl && prevUrl !== currentUrl);
  }

  const referrerPath =
    typeof document !== "undefined"
      ? parseSameOriginPath(document.referrer)
      : null;
  return Boolean(referrerPath && referrerPath !== currentUrl);
}
