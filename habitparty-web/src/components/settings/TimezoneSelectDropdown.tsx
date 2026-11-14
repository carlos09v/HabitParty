"use client";

import { Check, Compass, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { cn } from "@/utils";
import {
  formatTimeZoneOffsetLabel,
  getSupportedTimeZones,
  isValidIanaTimeZone,
} from "@/utils/date";

interface TimezoneOptionItem {
  value: string;
  offset: string;
  searchText: string;
}

interface TimezoneSelectDropdownProps {
  selectedTimezone: string;
  persistedTimezone: string;
  browserTimezone: string | null;
  disabled?: boolean;
  onSelectTimezone: (tz: string) => void;
}

export function TimezoneSelectDropdown({
  selectedTimezone,
  persistedTimezone,
  browserTimezone,
  disabled = false,
  onSelectTimezone,
}: TimezoneSelectDropdownProps) {
  const t = useTranslations("settings.timezoneCard");
  const [searchQuery, setSearchQuery] = useState("");

  const allZoneItems = useMemo<TimezoneOptionItem[]>(() => {
    const baseZones = getSupportedTimeZones();
    const zoneSet = new Set(baseZones);
    if (isValidIanaTimeZone(persistedTimezone)) {
      zoneSet.add(persistedTimezone);
    }
    if (isValidIanaTimeZone(browserTimezone)) {
      zoneSet.add(browserTimezone);
    }

    return Array.from(zoneSet)
      .sort()
      .map((tz) => {
        const offset = formatTimeZoneOffsetLabel(tz);
        return {
          value: tz,
          offset,
          searchText:
            `${tz} ${tz.replaceAll("_", " ")} ${offset}`.toLowerCase(),
        };
      });
  }, [persistedTimezone, browserTimezone]);

  const filteredZones = useMemo<TimezoneOptionItem[]>(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      const pinnedOrder = [selectedTimezone, browserTimezone].filter(
        (tz): tz is string => Boolean(tz && isValidIanaTimeZone(tz)),
      );
      const pinnedUnique = Array.from(new Set(pinnedOrder));
      const pinnedItems = pinnedUnique
        .map((tz) => allZoneItems.find((item) => item.value === tz))
        .filter((item): item is TimezoneOptionItem => Boolean(item));
      const pinnedSet = new Set(pinnedUnique);
      return [
        ...pinnedItems,
        ...allZoneItems.filter((item) => !pinnedSet.has(item.value)),
      ];
    }

    return allZoneItems.filter((item) => item.searchText.includes(query));
  }, [allZoneItems, browserTimezone, searchQuery, selectedTimezone]);

  const handleUseBrowserTimezone = () => {
    if (!browserTimezone) return;
    onSelectTimezone(browserTimezone);
    setSearchQuery("");
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            className={cn(
              "w-full rounded-lg pl-9 pr-8 py-2.5 text-body-s transition-colors",
              "bg-card border border-neutral-600 text-neutral-100 placeholder:text-neutral-400",
              "dark:bg-primary-dark/20 dark:border-primary/30",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 dark:focus-visible:border-primary-light",
            )}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-100 cursor-pointer p-0.5"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {browserTimezone && (
          <button
            type="button"
            onClick={handleUseBrowserTimezone}
            disabled={disabled}
            className={cn(
              "shrink-0 inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer",
              "border-neutral-600 bg-surface text-neutral-100 hover:border-primary/60 hover:bg-surface-hover",
              "dark:border-primary/30 dark:bg-primary-dark/25 dark:hover:bg-primary-dark/40",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            <Compass size={14} className="text-gold shrink-0" />
            <span>{t("detectBrowserButton")}</span>
          </button>
        )}
      </div>

      <div
        role="listbox"
        aria-label={t("selectLabel")}
        className="max-h-56 overflow-y-auto rounded-xl border border-neutral-600/70 dark:border-primary/25 bg-card dark:bg-surface/40 p-1.5 space-y-1"
      >
        {filteredZones.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-neutral-400">
            {t("noResults", { query: searchQuery.trim() })}
          </div>
        ) : (
          filteredZones.map((zone) => {
            const isSelected = zone.value === selectedTimezone;
            return (
              <button
                key={zone.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => onSelectTimezone(zone.value)}
                disabled={disabled}
                className={cn(
                  "w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-left text-xs sm:text-sm transition-colors cursor-pointer",
                  isSelected
                    ? "bg-amber-500/15 dark:bg-gold/15 text-amber-800 dark:text-gold font-bold border border-amber-500/35 dark:border-gold/35"
                    : "text-neutral-200 hover:bg-surface-hover/70 border border-transparent",
                )}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span
                    className={cn(
                      "w-4 h-4 rounded-full flex items-center justify-center shrink-0",
                      isSelected
                        ? "bg-amber-600 dark:bg-gold text-white dark:text-on-gold"
                        : "border border-neutral-500/60",
                    )}
                  >
                    {isSelected && <Check size={11} strokeWidth={3} />}
                  </span>
                  <span className="truncate font-mono">
                    {zone.value.replaceAll("_", " ")}
                  </span>
                </span>
                <span className="shrink-0 font-mono text-label-g px-2 py-0.5 rounded bg-black/15 dark:bg-white/10 text-neutral-300">
                  {zone.offset}
                </span>
              </button>
            );
          })
        )}
      </div>
    </>
  );
}
