"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/utils";

interface ContextualBackButtonProps {
  fallbackHref: string;
  label: string;
  historyLabel?: string;
  preferHistoryBack?: boolean;
  className?: string;
}

/**
 * Link contextual de retorno que prioriza `router.back()` para navegacoes internas
 * da mesma origem (quando habilitado) e cai com seguranca no `fallbackHref`.
 */
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

function canNavigateBackInApp(): boolean {
  if (typeof window === "undefined") return false;
  if (window.history.length <= 1) return false;

  const currentUrl = `${window.location.pathname}${window.location.search}`;
  const navApi = (
    window as Window & {
      navigation?: {
        currentEntry?: { index?: number } | null;
        entries?: () => Array<{ url?: string | null }>;
      };
    }
  ).navigation;

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

  try {
    const raw = window.sessionStorage.getItem("hp_nav_trail");
    if (raw) {
      const parsed = JSON.parse(raw) as { urls?: unknown; index?: unknown };
      if (
        Array.isArray(parsed.urls) &&
        typeof parsed.index === "number" &&
        parsed.index > 0
      ) {
        const prevUrl = parsed.urls[parsed.index - 1];
        return typeof prevUrl === "string" && prevUrl !== currentUrl;
      }
    }
  } catch {
    // Fallback abaixo usando referrer estrito
  }

  const referrerPath =
    typeof document !== "undefined"
      ? parseSameOriginPath(document.referrer)
      : null;
  return Boolean(referrerPath && referrerPath !== currentUrl);
}

export function ContextualBackButton({
  fallbackHref,
  label,
  historyLabel,
  preferHistoryBack = false,
  className,
}: ContextualBackButtonProps) {
  const router = useRouter();
  const [canUseHistoryBack, setCanUseHistoryBack] = useState(false);

  useEffect(() => {
    if (!preferHistoryBack || typeof window === "undefined") {
      setCanUseHistoryBack(false);
      return;
    }

    const syncBackAvailability = () => {
      setCanUseHistoryBack(canNavigateBackInApp());
    };

    syncBackAvailability();
    window.addEventListener("popstate", syncBackAvailability);
    window.addEventListener("hp:nav-trail-updated", syncBackAvailability);
    return () => {
      window.removeEventListener("popstate", syncBackAvailability);
      window.removeEventListener("hp:nav-trail-updated", syncBackAvailability);
    };
  }, [preferHistoryBack]);

  const resolvedLabel =
    canUseHistoryBack && historyLabel ? historyLabel : label;

  return (
    <Link
      href={fallbackHref}
      onClick={(e) => {
        if (
          canUseHistoryBack &&
          !e.metaKey &&
          !e.ctrlKey &&
          !e.shiftKey &&
          !e.altKey
        ) {
          e.preventDefault();
          router.back();
        }
      }}
      className={cn(
        "inline-flex items-center gap-2 text-xs font-bold text-neutral-300 hover:text-amber-800 dark:hover:text-gold transition-colors w-fit",
        className,
      )}
    >
      <ArrowLeft size={14} aria-hidden="true" />
      <span>{resolvedLabel}</span>
    </Link>
  );
}
