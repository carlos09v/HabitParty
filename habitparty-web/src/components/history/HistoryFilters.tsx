"use client";

import { Download } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { exportTransactionsCsvAction } from "@/actions/historyActions";
import { FilterBar } from "@/components/ui/FilterBar";
import { Select } from "@/components/ui/Select";
import { HISTORY_TABS, PERIOD_OPTIONS } from "@/constants/history";
import type { HistoryPeriodFilter } from "@/types/history";
import { cn, downloadBlob } from "@/utils";

interface HistoryFiltersProps {
  currentTab: string;
  currentPeriod: HistoryPeriodFilter;
  currentSearch: string;
  isCompact?: boolean;
}

export function HistoryFilters({
  currentTab,
  currentPeriod,
  currentSearch,
  isCompact = false,
}: HistoryFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchInput, setSearchInput] = useState(currentSearch || "");
  const [isExporting, startExport] = useTransition();
  const [, startTransition] = useTransition();

  // Sincroniza o input com alterações vindas da URL
  useEffect(() => {
    setSearchInput(currentSearch || "");
  }, [currentSearch]);

  // Atualização com debounce para busca textual na URL
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchInput.trim();
      const activeSearch = currentSearch || "";

      if (trimmed !== activeSearch) {
        const params = new URLSearchParams(searchParams.toString());
        if (trimmed) {
          params.set("search", trimmed);
        } else {
          params.delete("search");
        }
        params.set("page", "1");

        startTransition(() => {
          router.push(`${pathname}?${params.toString()}`, { scroll: false });
        });
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput, currentSearch, pathname, router, searchParams]);

  const handlePeriodChange = (val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (val === "ALL") {
      params.delete("period");
    } else {
      params.set("period", val);
    }
    params.set("page", "1");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  const handleTabChange = (tabId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tabId === "ALL") {
      params.delete("tab");
    } else {
      params.set("tab", tabId);
    }
    params.set("page", "1");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  const handleExportCsv = () => {
    startExport(async () => {
      const res = await exportTransactionsCsvAction();
      if (!res.success) {
        toast.error(res.error || "Erro ao exportar extrato.");
        return;
      }

      if (res.data) {
        try {
          const dateStr = new Date().toISOString().split("T")[0];
          downloadBlob(res.data, `meu_extrato_${dateStr}.csv`);
          toast.success("Extrato exportado com sucesso em CSV!");
        } catch {
          toast.error("Falha ao salvar o arquivo CSV.");
        }
      }
    });
  };

  return (
    <FilterBar
      search={{
        value: searchInput,
        onChange: setSearchInput,
        placeholder: "Pesquisar transação...",
      }}
      middleActions={
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs font-semibold text-neutral-400 hidden sm:inline">
            Período:
          </span>
          <Select
            options={
              PERIOD_OPTIONS as unknown as { value: string; label: string }[]
            }
            value={currentPeriod}
            onChange={handlePeriodChange}
            compact
            className="w-36 sm:w-44"
            triggerClassName="py-1.5 text-xs bg-surface border-white/15"
          />
        </div>
      }
      leftActions={
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface/60 border border-white/10 shrink-0 overflow-x-auto max-w-full">
          {HISTORY_TABS.map((tab) => {
            const isActive = (currentTab || "ALL") === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "px-3 rounded-lg font-semibold transition-all cursor-pointer select-none whitespace-nowrap",
                  isCompact ? "py-1 text-xs" : "py-1.5 text-xs",
                  isActive
                    ? "bg-gold text-neutral-900 shadow-xs font-bold"
                    : "text-neutral-300 hover:text-neutral-50 hover:bg-white/5",
                )}
              >
                {tab.label}
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
            "rounded-xl border border-gold/40 bg-gold/15 text-gold hover:bg-gold hover:text-neutral-900 transition-all font-bold flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed shrink-0",
            isCompact
              ? "px-2.5 py-1.5 text-xs"
              : "px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm",
          )}
          title="Exportar Extrato em formato CSV"
        >
          <Download
            size={isCompact ? 14 : 16}
            className={isExporting ? "animate-bounce" : ""}
          />
          <span className="hidden sm:inline">
            {isExporting ? "Exportando..." : "Exportar CSV"}
          </span>
          <span className="sm:hidden">
            {isExporting ? "Exportando..." : "CSV"}
          </span>
        </button>
      }
    />
  );
}
