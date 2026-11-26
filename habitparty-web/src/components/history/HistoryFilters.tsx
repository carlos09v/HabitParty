"use client";

import { Download, Loader2, RotateCcw, SlidersHorizontal } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";
import { DatePicker } from "@/components/ui/DatePicker";
import { FilterBar } from "@/components/ui/FilterBar";
import { Select } from "@/components/ui/Select";
import {
  DEFAULT_HISTORY_PAGE_SIZE,
  DIRECTION_OPTIONS,
  HISTORY_PAGE_SIZE_OPTIONS,
  HISTORY_TABS,
  PERIOD_OPTIONS,
  SORT_OPTIONS,
} from "@/constants/history";
import { useDebouncedUrlSearch } from "@/hooks/useDebouncedUrlSearch";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useUserStore } from "@/store/userStore";
import type {
  HistoryDirectionFilter,
  HistoryPeriodFilter,
  HistorySortOption,
  HistoryTabId,
} from "@/types/history";
import { cn } from "@/utils/cn";
import { getTodayDateString } from "@/utils/date";
import { downloadBlob } from "@/utils/download";
import {
  buildHistoryBackendParams,
  buildHistoryHref,
  countActiveAdvancedFilters,
  hasActiveHistoryFilters,
  type NormalizedHistoryQuery,
} from "@/utils/historyUtils";

interface HistoryFiltersProps {
  query: NormalizedHistoryQuery;
}

export function HistoryFilters({ query }: HistoryFiltersProps) {
  const t = useTranslations("history.filters");
  const { isGamified } = useExperienceMode();
  const userTimeZone = useUserStore((s) => s.user?.timezone);
  const router = useRouter();
  const pathname = usePathname();

  const [optimisticQuery, setOptimisticQuery] =
    useState<NormalizedHistoryQuery>(query);
  const [showAdvanced, setShowAdvanced] = useState(
    () => countActiveAdvancedFilters(query) > 0,
  );
  const [isExporting, setIsExporting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const tabButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const prevServerAdvancedCountRef = useRef(countActiveAdvancedFilters(query));

  const latestQueryRef = useRef<NormalizedHistoryQuery>(optimisticQuery);

  const navigateWithQuery = (next: NormalizedHistoryQuery) => {
    setOptimisticQuery(next);
    latestQueryRef.current = next;
    const href = buildHistoryHref(pathname, { ...next, page: 1 });
    startTransition(() => {
      router.replace(href, { scroll: false });
    });
  };

  const { searchInput, setSearchInput, cancel, reset } = useDebouncedUrlSearch({
    currentSearch: query.search,
    onDebouncedChange: (trimmed) => {
      const next: NormalizedHistoryQuery = {
        ...latestQueryRef.current,
        search: trimmed,
        page: 1,
      };
      navigateWithQuery(next);
    },
  });

  useEffect(() => {
    latestQueryRef.current = {
      ...optimisticQuery,
      search: searchInput,
    };
  }, [optimisticQuery, searchInput]);

  useEffect(() => {
    setOptimisticQuery(query);
    const nextAdvancedCount = countActiveAdvancedFilters(query);
    if (nextAdvancedCount > 0) {
      setShowAdvanced(true);
    } else if (prevServerAdvancedCountRef.current > 0) {
      setShowAdvanced(false);
    }
    prevServerAdvancedCountRef.current = nextAdvancedCount;
  }, [query]);

  const localizedPeriodOptions = PERIOD_OPTIONS.map((opt) => ({
    value: opt.value,
    label: t(`periods.${opt.value}`),
  }));

  const localizedDirectionOptions = DIRECTION_OPTIONS.map((opt) => ({
    value: opt.value,
    label: t(`directions.${opt.value}`),
  }));

  const localizedSortOptions = SORT_OPTIONS.map((opt) => ({
    value: opt.value,
    label: t(`sorts.${opt.value}`),
  }));

  const localizedPageSizeOptions = HISTORY_PAGE_SIZE_OPTIONS.map((size) => ({
    value: String(size),
    label: t("pageSizeOption", { size }),
  }));

  const applyFilterPatch = (patch: Partial<NormalizedHistoryQuery>) => {
    cancel();
    const base: NormalizedHistoryQuery = {
      ...optimisticQuery,
      search: searchInput,
    };
    const next: NormalizedHistoryQuery = {
      ...base,
      ...patch,
      search: patch.search !== undefined ? patch.search : base.search.trim(),
      page: 1,
    };
    if (patch.period && patch.period !== "CUSTOM") {
      next.from = "";
      next.to = "";
    }
    navigateWithQuery(next);
  };

  const handleCustomDateChange = (field: "from" | "to", value: string) => {
    const nextFrom = field === "from" ? value : optimisticQuery.from;
    const nextTo = field === "to" ? value : optimisticQuery.to;
    if (!nextFrom && !nextTo) {
      applyFilterPatch({ period: "ALL", from: "", to: "" });
      return;
    }
    applyFilterPatch({
      period: "CUSTOM",
      from: nextFrom,
      to: nextTo,
    });
  };

  const handleTabChange = (tabId: HistoryTabId) => {
    if (tabId === optimisticQuery.tab) return;
    applyFilterPatch({ tab: tabId });
  };

  // Ativação manual (MWG tabs): setas movem apenas o foco para não disparar router.replace/fetch nas abas intermediárias; Enter/Espaço ativam via onClick
  const handleTabKeyDown = (
    e: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    const count = HISTORY_TABS.length;
    let nextIndex: number | null = null;
    if (e.key === "ArrowRight") nextIndex = (index + 1) % count;
    else if (e.key === "ArrowLeft") nextIndex = (index - 1 + count) % count;
    else if (e.key === "Home") nextIndex = 0;
    else if (e.key === "End") nextIndex = count - 1;

    if (nextIndex !== null) {
      e.preventDefault();
      tabButtonRefs.current[nextIndex]?.focus();
    }
  };

  const handlePeriodChange = (val: string) => {
    const nextPeriod = (val as HistoryPeriodFilter) || "ALL";
    if (nextPeriod === optimisticQuery.period) return;
    if (nextPeriod === "CUSTOM") {
      setShowAdvanced(true);
      const todayStr = getTodayDateString(new Date(), userTimeZone);
      applyFilterPatch({
        period: "CUSTOM",
        from: optimisticQuery.from || todayStr,
        to: optimisticQuery.to || todayStr,
      });
      return;
    }
    applyFilterPatch({ period: nextPeriod, from: "", to: "" });
  };

  const handleClearAll = () => {
    reset("");
    setShowAdvanced(false);
    navigateWithQuery({
      tab: "ALL",
      period: "ALL",
      from: "",
      to: "",
      search: "",
      direction: "ALL",
      sort: "NEWEST",
      page: 1,
      size: DEFAULT_HISTORY_PAGE_SIZE,
    });
  };

  const handleExportCsv = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const current: NormalizedHistoryQuery = {
        ...optimisticQuery,
        search: searchInput.trim(),
      };
      const params = buildHistoryBackendParams(current);

      const qs = params.toString();
      const response = await fetch(
        `/api/transactions/export${qs ? `?${qs}` : ""}`,
        { method: "GET" },
      );

      if (!response.ok) {
        let message = t("toasts.exportError");
        try {
          const errJson = await response.json();
          if (errJson?.error) message = String(errJson.error);
        } catch {
          // Mantém mensagem padrão
        }
        toast.error(message);
        return;
      }

      const csvBlob = await response.blob();
      const dateStr = getTodayDateString(new Date(), userTimeZone);
      const tabSuffix =
        current.tab !== "ALL" ? `_${current.tab.toLowerCase()}` : "";
      const periodSuffix =
        current.period !== "ALL" ? `_${current.period.toLowerCase()}` : "";
      const prefix = t("csvFilenamePrefix");

      downloadBlob(
        csvBlob,
        `${prefix}${tabSuffix}${periodSuffix}_${dateStr}.csv`,
      );
      toast.success(t("toasts.exportSuccess"));
    } catch {
      toast.error(t("toasts.saveFileError"));
    } finally {
      setIsExporting(false);
    }
  };

  const effectiveQuery: NormalizedHistoryQuery = {
    ...optimisticQuery,
    search: searchInput,
  };
  const activeFilters =
    hasActiveHistoryFilters(effectiveQuery) ||
    optimisticQuery.sort !== "NEWEST" ||
    optimisticQuery.size !== DEFAULT_HISTORY_PAGE_SIZE;

  const advancedCount = countActiveAdvancedFilters(optimisticQuery);

  return (
    <div className="flex flex-col gap-2.5">
      <FilterBar
        search={{
          value: searchInput,
          onChange: setSearchInput,
          placeholder: t("searchPlaceholder"),
        }}
        leftActions={
          <div
            role="tablist"
            aria-label={t("tabsAria")}
            className="flex items-center gap-1 p-1 rounded-xl bg-surface dark:bg-surface/60 border border-neutral-700 dark:border-white/10 shrink-0 overflow-x-auto max-w-full"
          >
            {HISTORY_TABS.map((tab, idx) => {
              const isActive = optimisticQuery.tab === tab.id;
              const tabLabel =
                tab.id === "BACKPACK"
                  ? isGamified
                    ? t("tabs.BACKPACK_GAMIFIED")
                    : t("tabs.BACKPACK_PRODUCTIVITY")
                  : tab.id === "SHOPPING"
                    ? isGamified
                      ? t("tabs.SHOPPING_GAMIFIED")
                      : t("tabs.SHOPPING_PRODUCTIVITY")
                    : t(`tabs.${tab.id}`);

              return (
                <button
                  key={tab.id}
                  ref={(el) => {
                    tabButtonRefs.current[idx] = el;
                  }}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => handleTabChange(tab.id)}
                  onKeyDown={(e) => handleTabKeyDown(e, idx)}
                  className={cn(
                    "relative px-3 rounded-lg font-semibold transition-colors cursor-pointer select-none whitespace-nowrap py-1.5 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60",
                    isActive
                      ? "bg-gold text-on-gold shadow-xs font-bold after:content-[''] after:absolute after:inset-x-2.5 after:bottom-0.5 after:h-0.5 after:rounded-full after:bg-on-gold/70 forced-colors:outline-2 forced-colors:outline-solid forced-colors:outline-[Highlight]"
                      : "text-neutral-300 hover:text-neutral-50 hover:bg-card dark:hover:bg-white/5",
                  )}
                >
                  {tabLabel}
                </button>
              );
            })}
          </div>
        }
        middleActions={
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs font-semibold text-neutral-400 hidden sm:inline">
                {t("periodLabel")}
              </span>
              <Select
                options={localizedPeriodOptions}
                value={optimisticQuery.period}
                onChange={handlePeriodChange}
                aria-label={t("periodAria")}
                compact
                className="w-36 sm:w-44"
                triggerClassName="py-1.5 text-xs bg-card dark:bg-surface border-neutral-600 dark:border-white/15"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowAdvanced((prev) => !prev)}
              aria-expanded={showAdvanced}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50",
                showAdvanced || advancedCount > 0
                  ? "border-amber-500/45 bg-amber-500/15 text-amber-800 dark:border-gold/45 dark:bg-gold/15 dark:text-gold"
                  : "border-neutral-600 dark:border-white/15 bg-card dark:bg-surface text-neutral-200 hover:border-neutral-500 dark:hover:border-white/25",
              )}
            >
              <SlidersHorizontal size={13} aria-hidden="true" />
              <span>{t("advancedToggle")}</span>
              {advancedCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-gold text-on-gold text-[10px] font-black inline-flex items-center justify-center">
                  {advancedCount}
                </span>
              )}
            </button>

            {activeFilters && (
              <button
                type="button"
                onClick={handleClearAll}
                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-neutral-300 hover:text-neutral-50 hover:bg-surface-hover dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <RotateCcw size={12} aria-hidden="true" />
                <span>{t("clearAll")}</span>
              </button>
            )}

            <output
              aria-live="polite"
              className="inline-flex items-center text-amber-700 dark:text-gold"
            >
              {isPending && (
                <>
                  <Loader2
                    size={14}
                    className="animate-spin"
                    aria-hidden="true"
                  />
                  <span className="sr-only">{t("updatingStatus")}</span>
                </>
              )}
            </output>
          </div>
        }
        rightActions={
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={isExporting}
            className="rounded-xl border border-amber-500/40 bg-amber-500/15 text-amber-800 hover:bg-gold hover:text-on-gold dark:border-gold/40 dark:bg-gold/15 dark:text-gold transition-colors font-bold flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed shrink-0 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm"
            title={t("exportButtonTitle")}
          >
            {isExporting ? (
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            ) : (
              <Download size={16} aria-hidden="true" />
            )}
            <span className="hidden sm:inline">
              {isExporting ? t("exporting") : t("exportCsvButton")}
            </span>
            <span className="sm:hidden">
              {isExporting ? t("exporting") : t("exportCsvShort")}
            </span>
          </button>
        }
      />

      {showAdvanced && (
        <div className="flex flex-wrap items-end gap-3 p-3 rounded-xl bg-card/70 dark:bg-surface/40 border border-neutral-700 dark:border-white/10 animate-in fade-in duration-150">
          {optimisticQuery.period === "CUSTOM" && (
            <div className="flex items-end gap-2 flex-wrap">
              <div className="w-40">
                <DatePicker
                  id="history-date-from"
                  label={t("dateFromLabel")}
                  value={optimisticQuery.from}
                  maxDate={optimisticQuery.to || undefined}
                  onChange={(val) => handleCustomDateChange("from", val)}
                  allowClear
                  compact
                />
              </div>
              <div className="w-40">
                <DatePicker
                  id="history-date-to"
                  label={t("dateToLabel")}
                  value={optimisticQuery.to}
                  minDate={optimisticQuery.from || undefined}
                  onChange={(val) => handleCustomDateChange("to", val)}
                  allowClear
                  compact
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1 min-w-36">
            <span className="text-tiny font-semibold text-neutral-400">
              {t("directionLabel")}
            </span>
            <Select
              options={localizedDirectionOptions}
              value={optimisticQuery.direction}
              onChange={(val) =>
                applyFilterPatch({
                  direction: (val as HistoryDirectionFilter) || "ALL",
                })
              }
              aria-label={t("directionAria")}
              compact
              triggerClassName="py-1.5 text-xs bg-card dark:bg-surface border-neutral-600 dark:border-white/15"
            />
          </div>

          <div className="flex flex-col gap-1 min-w-36">
            <span className="text-tiny font-semibold text-neutral-400">
              {t("sortLabel")}
            </span>
            <Select
              options={localizedSortOptions}
              value={optimisticQuery.sort}
              onChange={(val) =>
                applyFilterPatch({
                  sort: (val as HistorySortOption) || "NEWEST",
                })
              }
              aria-label={t("sortAria")}
              compact
              triggerClassName="py-1.5 text-xs bg-card dark:bg-surface border-neutral-600 dark:border-white/15"
            />
          </div>

          <div className="flex flex-col gap-1 min-w-28">
            <span className="text-tiny font-semibold text-neutral-400">
              {t("pageSizeLabel")}
            </span>
            <Select
              options={localizedPageSizeOptions}
              value={String(optimisticQuery.size)}
              onChange={(val) => {
                const parsed = Number.parseInt(val, 10);
                if (Number.isFinite(parsed)) {
                  applyFilterPatch({ size: parsed });
                }
              }}
              aria-label={t("pageSizeAria")}
              compact
              triggerClassName="py-1.5 text-xs bg-card dark:bg-surface border-neutral-600 dark:border-white/15"
            />
          </div>
        </div>
      )}
    </div>
  );
}
