"use client";

import { Download } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { exportTransactionsCsvAction } from "@/actions/historyActions";
import { FilterBar } from "@/components/ui/FilterBar";
import { Select } from "@/components/ui/Select";
import { HISTORY_TABS, PERIOD_OPTIONS } from "@/constants/history";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useUserStore } from "@/store/userStore";
import type { HistoryPeriodFilter } from "@/types/history";
import { cn, downloadBlob, getTodayDateString } from "@/utils";

interface HistoryFiltersProps {
  currentTab: string;
  currentPeriod: HistoryPeriodFilter;
  currentSearch: string;
  isCompact?: boolean;
}

function buildHistoryUrl(
  pathname: string,
  tab: string,
  period: string,
  search: string,
): string {
  const params = new URLSearchParams();
  if (tab && tab !== "ALL") {
    params.set("tab", tab);
  }
  if (period && period !== "ALL") {
    params.set("period", period);
  }
  const trimmedSearch = search.trim();
  if (trimmedSearch) {
    params.set("search", trimmedSearch);
  }
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function HistoryFilters({
  currentTab,
  currentPeriod,
  currentSearch,
  isCompact = false,
}: HistoryFiltersProps) {
  const t = useTranslations("history.filters");
  const { isGamified } = useExperienceMode();
  const userTimeZone = useUserStore((s) => s.user?.timezone);
  const router = useRouter();
  const pathname = usePathname();

  const [optimisticTab, setOptimisticTab] = useState(currentTab || "ALL");
  const [optimisticPeriod, setOptimisticPeriod] = useState<HistoryPeriodFilter>(
    currentPeriod || "ALL",
  );
  const [searchInput, setSearchInput] = useState(currentSearch || "");
  const [isExporting, startExport] = useTransition();
  const [, startTransition] = useTransition();

  // Refs para evitar disparos duplicados e leitura de closures obsoletas
  const latestStateRef = useRef({
    tab: optimisticTab,
    period: optimisticPeriod,
    search: searchInput,
  });
  latestStateRef.current = {
    tab: optimisticTab,
    period: optimisticPeriod,
    search: searchInput,
  };

  const localizedPeriodOptions = useMemo(
    () =>
      PERIOD_OPTIONS.map((opt) => ({
        value: opt.value,
        label: t(`periods.${opt.value}`),
      })),
    [t],
  );

  // Sincroniza estados locais quando os parâmetros do servidor mudam externamente
  useEffect(() => {
    setOptimisticTab(currentTab || "ALL");
  }, [currentTab]);

  useEffect(() => {
    setOptimisticPeriod(currentPeriod || "ALL");
  }, [currentPeriod]);

  useEffect(() => {
    setSearchInput(currentSearch || "");
  }, [currentSearch]);

  // Atualização com debounce para busca textual na URL
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchInput.trim();
      const activeSearch = currentSearch || "";

      if (trimmed !== activeSearch) {
        const nextUrl = buildHistoryUrl(
          pathname,
          latestStateRef.current.tab,
          latestStateRef.current.period,
          trimmed,
        );
        startTransition(() => {
          router.replace(nextUrl, { scroll: false });
        });
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput, currentSearch, pathname, router]);

  const handlePeriodChange = (val: string) => {
    const nextPeriod = (val as HistoryPeriodFilter) || "ALL";
    if (nextPeriod === latestStateRef.current.period) {
      return;
    }

    setOptimisticPeriod(nextPeriod);
    latestStateRef.current.period = nextPeriod;

    const nextUrl = buildHistoryUrl(
      pathname,
      latestStateRef.current.tab,
      nextPeriod,
      latestStateRef.current.search,
    );

    startTransition(() => {
      router.replace(nextUrl, { scroll: false });
    });
  };

  const handleTabChange = (tabId: string) => {
    const nextTab = tabId || "ALL";
    if (nextTab === latestStateRef.current.tab) {
      return;
    }

    setOptimisticTab(nextTab);
    latestStateRef.current.tab = nextTab;

    const nextUrl = buildHistoryUrl(
      pathname,
      nextTab,
      latestStateRef.current.period,
      latestStateRef.current.search,
    );

    startTransition(() => {
      router.replace(nextUrl, { scroll: false });
    });
  };

  const handleExportCsv = () => {
    startExport(async () => {
      const res = await exportTransactionsCsvAction({
        tab: optimisticTab,
        period: optimisticPeriod,
        search: searchInput.trim() || currentSearch,
      });
      if (!res.success) {
        toast.error(res.error || t("toasts.exportError"));
        return;
      }

      if (res.data) {
        try {
          const dateStr = getTodayDateString(new Date(), userTimeZone);
          const tabSuffix =
            optimisticTab && optimisticTab !== "ALL"
              ? `_${optimisticTab.toLowerCase()}`
              : "";
          const periodSuffix =
            optimisticPeriod && optimisticPeriod !== "ALL"
              ? `_${optimisticPeriod.toLowerCase()}`
              : "";
          const prefix = t("csvFilenamePrefix");
          downloadBlob(
            res.data,
            `${prefix}${tabSuffix}${periodSuffix}_${dateStr}.csv`,
          );
          toast.success(t("toasts.exportSuccess"));
        } catch {
          toast.error(t("toasts.saveFileError"));
        }
      }
    });
  };

  return (
    <FilterBar
      search={{
        value: searchInput,
        onChange: setSearchInput,
        placeholder: t("searchPlaceholder"),
      }}
      middleActions={
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs font-semibold text-neutral-400 hidden sm:inline">
            {t("periodLabel")}
          </span>
          <Select
            options={localizedPeriodOptions}
            value={optimisticPeriod}
            onChange={handlePeriodChange}
            compact
            className="w-36 sm:w-44"
            triggerClassName="py-1.5 text-xs bg-card dark:bg-surface border-neutral-600 dark:border-white/15"
          />
        </div>
      }
      leftActions={
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface dark:bg-surface/60 border border-neutral-700 dark:border-white/10 shrink-0 overflow-x-auto max-w-full">
          {HISTORY_TABS.map((tab) => {
            const isActive = optimisticTab === tab.id;
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
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "px-3 rounded-lg font-semibold transition-colors cursor-pointer select-none whitespace-nowrap",
                  isCompact ? "py-1 text-xs" : "py-1.5 text-xs",
                  isActive
                    ? "bg-gold text-on-gold shadow-xs font-bold"
                    : "text-neutral-300 hover:text-neutral-50 hover:bg-card dark:hover:bg-white/5",
                )}
              >
                {tabLabel}
              </button>
            );
          })}
        </div>
      }
      rightActions={
        <button
          type="button"
          onClick={handleExportCsv}
          disabled={isExporting}
          className={cn(
            "rounded-xl border border-amber-500/40 bg-amber-500/15 text-amber-800 hover:bg-gold hover:text-on-gold dark:border-gold/40 dark:bg-gold/15 dark:text-gold transition-colors font-bold flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed shrink-0",
            isCompact
              ? "px-2.5 py-1.5 text-xs"
              : "px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm",
          )}
          title={t("exportButtonTitle")}
        >
          <Download
            size={isCompact ? 14 : 16}
            className={isExporting ? "opacity-60" : ""}
          />
          <span className="hidden sm:inline">
            {isExporting ? t("exporting") : t("exportCsvButton")}
          </span>
          <span className="sm:hidden">
            {isExporting ? t("exporting") : t("exportCsvShort")}
          </span>
        </button>
      }
    />
  );
}
