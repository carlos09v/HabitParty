"use client";

import { Info, Loader2, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useUpdateTimezone } from "@/hooks/useUpdateTimezone";
import { useUserStore } from "@/store/userStore";
import { cn } from "@/utils";
import {
  areTimeZonesEquivalent,
  DEFAULT_TIMEZONE,
  detectBrowserTimeZone,
  formatTimeZoneOffsetLabel,
  getTimeZoneCooldownRemainingMs,
  isValidIanaTimeZone,
} from "@/utils/date";
import { TimezoneSelectDropdown } from "./TimezoneSelectDropdown";

interface TimezoneSettingsProps {
  initialTimezone?: string | null;
  initialTimezoneUpdatedAt?: string | null;
}

export function TimezoneSettings({
  initialTimezone,
  initialTimezoneUpdatedAt,
}: TimezoneSettingsProps) {
  const t = useTranslations("settings.timezoneCard");
  const storeUser = useUserStore((state) => state.user);

  const persistedTimezone = isValidIanaTimeZone(storeUser?.timezone)
    ? storeUser.timezone
    : isValidIanaTimeZone(initialTimezone)
      ? initialTimezone
      : DEFAULT_TIMEZONE;

  const [selectedTimezone, setSelectedTimezone] = useState(persistedTimezone);
  const [browserTimezone, setBrowserTimezone] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState<number | null>(null);

  const { isPending, updateTimezone } = useUpdateTimezone({
    formatSuccessMessage: (tz) => t("toastSuccess", { timezone: tz }),
    errorMessage: t("toastError"),
    onSuccess: () => setNowMs(Date.now()),
  });

  useEffect(() => {
    setSelectedTimezone(persistedTimezone);
  }, [persistedTimezone]);

  useEffect(() => {
    setBrowserTimezone(detectBrowserTimeZone(DEFAULT_TIMEZONE));
  }, []);

  const effectiveTimezoneUpdatedAt =
    storeUser?.timezoneUpdatedAt ?? initialTimezoneUpdatedAt;

  const cooldownRemainingMs = useMemo(() => {
    if (nowMs === null) return 0;
    return getTimeZoneCooldownRemainingMs(
      effectiveTimezoneUpdatedAt,
      new Date(nowMs),
    );
  }, [effectiveTimezoneUpdatedAt, nowMs]);

  const isCooldownActive = cooldownRemainingMs > 0;
  const cooldownTotalMinutes = Math.ceil(cooldownRemainingMs / 60_000);
  const cooldownHours = Math.floor(cooldownTotalMinutes / 60);
  const cooldownMinutes = cooldownTotalMinutes % 60;

  useEffect(() => {
    setNowMs(Date.now());
    if (!effectiveTimezoneUpdatedAt) return;
    if (getTimeZoneCooldownRemainingMs(effectiveTimezoneUpdatedAt) <= 0) return;

    const timer = window.setInterval(() => {
      const nextNow = Date.now();
      setNowMs(nextNow);
      if (
        getTimeZoneCooldownRemainingMs(
          effectiveTimezoneUpdatedAt,
          new Date(nextNow),
        ) <= 0
      ) {
        window.clearInterval(timer);
      }
    }, 60_000);

    return () => window.clearInterval(timer);
  }, [effectiveTimezoneUpdatedAt]);

  const persistedOffset = useMemo(
    () => formatTimeZoneOffsetLabel(persistedTimezone),
    [persistedTimezone],
  );

  const browserOffset = useMemo(
    () => (browserTimezone ? formatTimeZoneOffsetLabel(browserTimezone) : null),
    [browserTimezone],
  );

  const hasBrowserMismatch = Boolean(
    browserTimezone &&
      !areTimeZonesEquivalent(persistedTimezone, browserTimezone),
  );

  const hasChanges = !areTimeZonesEquivalent(
    selectedTimezone,
    persistedTimezone,
  );

  const handleSave = () => {
    if (
      !hasChanges ||
      isCooldownActive ||
      !isValidIanaTimeZone(selectedTimezone)
    )
      return;
    updateTimezone(selectedTimezone);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border p-4 flex flex-col gap-1.5 bg-amber-500/10 dark:bg-gold/10 border-amber-500/30 dark:border-gold/30 text-amber-800 dark:text-gold">
        <div className="flex items-center gap-2.5 flex-wrap">
          <Sparkles
            size={18}
            className="shrink-0 text-amber-600 dark:text-gold"
          />
          <div className="text-body-s">
            <span className="font-bold">{t("activeLabel")}</span>
            <span className="font-mono font-semibold">{persistedTimezone}</span>
            <span className="ml-1.5 opacity-85 font-mono text-xs">
              ({persistedOffset})
            </span>
          </div>
        </div>
        {hasBrowserMismatch && browserTimezone && browserOffset && (
          <p className="text-xs text-neutral-300 pl-7">
            {t("browserDiffHint", {
              browserTz: browserTimezone,
              browserOffset,
            })}
          </p>
        )}
      </div>

      <TimezoneSelectDropdown
        selectedTimezone={selectedTimezone}
        persistedTimezone={persistedTimezone}
        browserTimezone={browserTimezone}
        disabled={isPending}
        onSelectTimezone={setSelectedTimezone}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <p
          className={cn(
            "text-xs flex items-start gap-1.5 leading-relaxed",
            isCooldownActive
              ? "text-amber-500 dark:text-amber-400 font-medium"
              : "text-neutral-400",
          )}
        >
          <Info
            size={14}
            className={cn(
              "shrink-0 mt-0.5",
              isCooldownActive
                ? "text-amber-500 dark:text-amber-400"
                : "text-neutral-400",
            )}
          />
          <span>
            {isCooldownActive
              ? t("cooldownActiveAlert", {
                  hours: cooldownHours,
                  minutes: cooldownMinutes,
                })
              : hasChanges
                ? t("cooldownHint")
                : t("noChangeHint")}
          </span>
        </p>

        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges || isCooldownActive || isPending}
          className={cn(
            "shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer",
            "bg-gold text-on-gold hover:bg-gold-hover shadow-glow-gold-sm",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none",
          )}
        >
          {isPending && <Loader2 size={14} className="animate-spin" />}
          <span>
            {isPending
              ? t("saving")
              : isCooldownActive
                ? t("cooldownButtonLabel", {
                    hours: cooldownHours,
                    minutes: cooldownMinutes,
                  })
                : t("saveButton")}
          </span>
        </button>
      </div>
    </div>
  );
}
