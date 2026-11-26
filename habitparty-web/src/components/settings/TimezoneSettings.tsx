"use client";

import { Info, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRegisterSettingsDirty } from "@/components/settings/SettingsDirtyContext";
import { SettingsSaveButton } from "@/components/settings/SettingsSaveButton";
import { useBrowserTimezoneState } from "@/hooks/useBrowserTimezoneState";
import { useUpdateTimezone } from "@/hooks/useUpdateTimezone";
import { useUserStore } from "@/store/userStore";
import { cn } from "@/utils/cn";
import {
  areTimeZonesEquivalent,
  DEFAULT_TIMEZONE,
  formatTimeZoneOffsetLabel,
  isValidIanaTimeZone,
} from "@/utils/date";
import { TimezoneSelectDropdown } from "./TimezoneSelectDropdown";

interface TimezoneSettingsProps {
  initialTimezone?: string | null;
  initialTimezoneUpdatedAt?: string | null;
  serverNowMs?: number;
}

export function TimezoneSettings({
  initialTimezone,
  initialTimezoneUpdatedAt,
  serverNowMs,
}: TimezoneSettingsProps) {
  const t = useTranslations("settings.timezoneCard");
  const storeUser = useUserStore((state) => state.user);

  const persistedTimezone = isValidIanaTimeZone(storeUser?.timezone)
    ? storeUser.timezone
    : isValidIanaTimeZone(initialTimezone)
      ? initialTimezone
      : DEFAULT_TIMEZONE;

  const [selectedTimezone, setSelectedTimezone] = useState(persistedTimezone);
  const syncedPersistedTzRef = useRef(persistedTimezone);

  const effectiveTimezoneUpdatedAt =
    storeUser?.timezoneUpdatedAt ?? initialTimezoneUpdatedAt;

  const {
    browserTimezone,
    refreshNow,
    isCooldownActive,
    cooldownHours,
    cooldownMinutes,
    hasBrowserMismatch,
  } = useBrowserTimezoneState({
    accountTimezone: persistedTimezone,
    timezoneUpdatedAt: effectiveTimezoneUpdatedAt,
    serverNowMs,
    tickCooldown: true,
  });

  const { isPending, updateTimezone } = useUpdateTimezone({
    formatSuccessMessage: (tz) => t("toastSuccess", { timezone: tz }),
    errorMessage: t("toastError"),
    onSuccess: refreshNow,
  });

  useEffect(() => {
    const prevPersisted = syncedPersistedTzRef.current;
    if (persistedTimezone !== prevPersisted) {
      setSelectedTimezone((curr) =>
        curr === prevPersisted ? persistedTimezone : curr,
      );
      syncedPersistedTzRef.current = persistedTimezone;
    }
  }, [persistedTimezone]);

  const persistedOffset = useMemo(
    () => formatTimeZoneOffsetLabel(persistedTimezone),
    [persistedTimezone],
  );

  const browserOffset = useMemo(
    () => (browserTimezone ? formatTimeZoneOffsetLabel(browserTimezone) : null),
    [browserTimezone],
  );

  const hasChanges = !areTimeZonesEquivalent(
    selectedTimezone,
    persistedTimezone,
  );

  useRegisterSettingsDirty(
    "timezone-settings",
    hasChanges && !isCooldownActive,
  );

  const handleSave = () => {
    if (
      isPending ||
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
            className="shrink-0 text-amber-800 dark:text-gold"
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
          <p className="text-xs text-neutral-300 pl-0 sm:pl-7">
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
        disabled={isPending || isCooldownActive}
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

        <SettingsSaveButton
          type="button"
          onClick={handleSave}
          isPending={isPending}
          disabled={!hasChanges || isCooldownActive}
          showSaveIcon={!isCooldownActive}
          savingLabel={t("saving")}
          label={
            isCooldownActive
              ? t("cooldownButtonLabel", {
                  hours: cooldownHours,
                  minutes: cooldownMinutes,
                })
              : t("saveButton")
          }
        />
      </div>
    </div>
  );
}
