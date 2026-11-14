"use client";

import { Globe, RefreshCw, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useUpdateTimezone } from "@/hooks/useUpdateTimezone";
import { useUserStore } from "@/store/userStore";
import type { UserResponseDTO } from "@/types/user";
import { cn } from "@/utils";
import {
  areTimeZonesEquivalent,
  canonicalizeTimeZone,
  DEFAULT_TIMEZONE,
  detectBrowserTimeZone,
  formatTimeZoneOffsetLabel,
  getTimeZoneCooldownRemainingMs,
  isValidIanaTimeZone,
} from "@/utils/date";

interface TimezoneMismatchBannerProps {
  initialUser: UserResponseDTO | null;
}

function buildDismissStorageKey(accountTz: string, browserTz: string): string {
  const normalizedAccount = canonicalizeTimeZone(accountTz) ?? accountTz;
  const normalizedBrowser = canonicalizeTimeZone(browserTz) ?? browserTz;
  return `hp_tz_mismatch_dismissed:${normalizedAccount}:${normalizedBrowser}`;
}

export function TimezoneMismatchBanner({
  initialUser,
}: TimezoneMismatchBannerProps) {
  const t = useTranslations("timezoneAlert");
  const storeUser = useUserStore((state) => state.user);

  const user = storeUser ?? initialUser;
  const accountTimezone = user?.timezone;

  const [browserTimezone, setBrowserTimezone] = useState<string | null>(null);
  const [dismissedPairKey, setDismissedPairKey] = useState<string | null>(null);
  const { isPending, updateTimezone } = useUpdateTimezone({
    formatSuccessMessage: (timezone) => t("updateSuccessToast", { timezone }),
    errorMessage: t("updateErrorToast"),
  });

  useEffect(() => {
    setBrowserTimezone(detectBrowserTimeZone(DEFAULT_TIMEZONE));
  }, []);

  const pairKey = useMemo(() => {
    if (
      !user ||
      !isValidIanaTimeZone(accountTimezone) ||
      !isValidIanaTimeZone(browserTimezone)
    ) {
      return null;
    }
    return buildDismissStorageKey(accountTimezone, browserTimezone);
  }, [accountTimezone, browserTimezone, user]);

  useEffect(() => {
    if (!pairKey) {
      setDismissedPairKey(null);
      return;
    }
    try {
      const stored = window.localStorage.getItem(pairKey);
      setDismissedPairKey(stored === "1" ? pairKey : null);
    } catch {
      setDismissedPairKey(null);
    }
  }, [pairKey]);

  const isCooldownActive = Boolean(
    browserTimezone &&
      getTimeZoneCooldownRemainingMs(user?.timezoneUpdatedAt) > 0,
  );

  const shouldShow = Boolean(
    user &&
      browserTimezone &&
      !isCooldownActive &&
      isValidIanaTimeZone(accountTimezone) &&
      !areTimeZonesEquivalent(accountTimezone, browserTimezone) &&
      pairKey &&
      dismissedPairKey !== pairKey,
  );

  if (!shouldShow || !accountTimezone || !browserTimezone || !pairKey) {
    return null;
  }

  const currentTzLabel = `${accountTimezone} (${formatTimeZoneOffsetLabel(accountTimezone)})`;
  const browserTzLabel = `${browserTimezone} (${formatTimeZoneOffsetLabel(browserTimezone)})`;

  const handleDismiss = () => {
    try {
      window.localStorage.setItem(pairKey, "1");
    } catch {
      // Ignora falhas de localStorage (ex: modo privado restritivo)
    }
    setDismissedPairKey(pairKey);
  };

  const handleUpdate = () => {
    updateTimezone(browserTimezone);
  };

  return (
    <aside
      aria-label={t("ariaLabel")}
      aria-live="polite"
      className="w-full shrink-0 border-b border-sky-500/35 dark:border-sky-400/30 bg-sky-50 dark:bg-[#19223B] px-4 py-2.5 z-20"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-sky-500/15 dark:bg-sky-400/15 border border-sky-500/35 dark:border-sky-400/30 flex items-center justify-center text-sky-700 dark:text-sky-300 shrink-0">
            <Globe size={15} />
          </div>
          <p className="text-xs sm:text-sm text-neutral-100 leading-snug">
            <strong className="text-sky-800 dark:text-sky-300 font-bold">
              {t("title")}
            </strong>{" "}
            <span className="text-neutral-300">
              {t("description", {
                currentTz: currentTzLabel,
                browserTz: browserTzLabel,
              })}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            type="button"
            onClick={handleUpdate}
            disabled={isPending}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer border",
              "border-gold/40 bg-gold text-on-gold hover:bg-gold-hover",
              "disabled:opacity-60 disabled:cursor-not-allowed",
            )}
          >
            <RefreshCw size={13} className={cn(isPending && "animate-spin")} />
            <span>
              {isPending
                ? t("updating")
                : t("updateButton", { browserTz: browserTimezone })}
            </span>
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            disabled={isPending}
            aria-label={t("dismissAria")}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
