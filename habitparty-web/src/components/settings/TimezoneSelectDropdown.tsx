"use client";

import { Check, Compass, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { cn } from "@/utils";
import {
  formatTimeZoneOffsetLabel,
  getSupportedTimeZones,
  isValidIanaTimeZone,
  PRIMARY_IANA_TIMEZONES,
} from "@/utils/date";

interface TimezoneOptionItem {
  value: string;
  offset: string;
  searchText: string;
}

const timezoneItemCache = new Map<string, TimezoneOptionItem>();
let cachedAllZoneItems: TimezoneOptionItem[] | null = null;
let cachedSortedZones: string[] | null = null;

function getTimezoneOptionItem(tz: string): TimezoneOptionItem {
  const cached = timezoneItemCache.get(tz);
  if (cached) return cached;
  const offset = formatTimeZoneOffsetLabel(tz);
  const item: TimezoneOptionItem = {
    value: tz,
    offset,
    searchText: `${tz} ${tz.replaceAll("_", " ")} ${offset}`.toLowerCase(),
  };
  timezoneItemCache.set(tz, item);
  return item;
}

function getSortedSupportedZones(): string[] {
  if (!cachedSortedZones) {
    cachedSortedZones = Array.from(new Set(getSupportedTimeZones())).sort();
  }
  return cachedSortedZones;
}

function getAllTimezoneOptionItems(): TimezoneOptionItem[] {
  if (!cachedAllZoneItems) {
    cachedAllZoneItems = getSortedSupportedZones().map(getTimezoneOptionItem);
  }
  return cachedAllZoneItems;
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

  const isSearchActive = searchQuery.trim().length > 0;

  const extraZones = useMemo(() => {
    const baseSet = new Set(getSortedSupportedZones());
    const extras: string[] = [];
    if (
      isValidIanaTimeZone(persistedTimezone) &&
      !baseSet.has(persistedTimezone)
    ) {
      extras.push(persistedTimezone);
    }
    if (
      browserTimezone &&
      isValidIanaTimeZone(browserTimezone) &&
      !baseSet.has(browserTimezone) &&
      browserTimezone !== persistedTimezone
    ) {
      extras.push(browserTimezone);
    }
    return extras;
  }, [persistedTimezone, browserTimezone]);

  const totalZoneCount = getSortedSupportedZones().length + extraZones.length;

  const filteredZones = useMemo<TimezoneOptionItem[]>(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      const pinnedUnique = Array.from(
        new Set(
          [selectedTimezone, browserTimezone].filter((tz): tz is string =>
            Boolean(tz && isValidIanaTimeZone(tz)),
          ),
        ),
      );
      const pinnedSet = new Set(pinnedUnique);
      const remainingPrimary = PRIMARY_IANA_TIMEZONES.filter(
        (tz) => !pinnedSet.has(tz),
      ).sort();
      return [...pinnedUnique, ...remainingPrimary].map(getTimezoneOptionItem);
    }

    const baseItems = getAllTimezoneOptionItems();
    const allItems =
      extraZones.length === 0
        ? baseItems
        : [...baseItems, ...extraZones.map(getTimezoneOptionItem)].sort(
            (a, b) => a.value.localeCompare(b.value),
          );

    return allItems.filter((item) => item.searchText.includes(query));
  }, [browserTimezone, extraZones, searchQuery, selectedTimezone]);

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
              "w-full rounded-lg pl-9 pr-9 py-2.5 text-base sm:text-body-s transition-colors",
              "bg-card border border-neutral-600 text-neutral-100 placeholder:text-neutral-400",
              "dark:bg-primary-dark/20 dark:border-primary/30",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 dark:focus-visible:border-primary-light",
            )}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-100 cursor-pointer p-1.5 rounded-md"
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

      {!isSearchActive && (
        <p className="text-xs text-neutral-400">
          {t("primaryListHint", {
            shown: filteredZones.length,
            total: totalZoneCount,
          })}
        </p>
      )}

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
                <span className="flex items-center gap-2 min-w-0 flex-1">
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
