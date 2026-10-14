"use client";

import { Download } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  deleteTransactionAction,
  exportTransactionsCsvAction,
} from "@/actions/historyActions";
import { TaskPagination } from "@/components/dashboard/TaskPagination";
import { FilterBar } from "@/components/ui/FilterBar";
import { HISTORY_TABS } from "@/constants/history";
import { useCompactMode } from "@/hooks/useCompactMode";
import type { HistoryContainerProps } from "@/types/history";
import { cn, downloadBlob } from "@/utils";
import { HistoryTable } from "./HistoryTable";

export function HistoryContainer({
  pageData,
  currentTab,
  currentPage,
  isCompact: propIsCompact,
}: HistoryContainerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isCompact: hookIsCompact } = useCompactMode();
  const isCompact = propIsCompact ?? hookIsCompact;

  const [searchQuery, setSearchQuery] = useState("");
  const [isExporting, startExport] = useTransition();
  const [isNavigating, startNavigating] = useTransition();

  const transactions = pageData.content || [];
  const totalElements = pageData.totalElements ?? transactions.length;
  const totalPages =
    pageData.totalPages ??
    Math.max(1, Math.ceil(totalElements / (pageData.size || 8)));

  // Filtro de busca local
  const filteredTransactions = searchQuery.trim()
    ? transactions.filter(
        (t) =>
          t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.transactionType?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : transactions;

  const handleTabChange = (tabId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tabId === "ALL") {
      params.delete("tab");
    } else {
      params.set("tab", tabId);
    }
    params.set("page", "1");
    startNavigating(() => {
      router.push(`${pathname}?${params.toString()}`);
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

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este registro do extrato?")) {
      return;
    }
    const res = await deleteTransactionAction(id);
    if (!res.success) {
      toast.error(res.error || "Erro ao excluir registro.");
      return;
    }
    toast.success("Registro removido com sucesso!");
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* BARRA DE FILTROS REUTILIZÁVEL (FILTERBAR) */}
      <FilterBar
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: "Pesquisar transação...",
        }}
        leftActions={
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface/60 border border-white/10 shrink-0">
            {HISTORY_TABS.map((tab) => {
              const isActive = (currentTab || "ALL") === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "px-3 rounded-lg font-semibold transition-all cursor-pointer select-none",
                    isCompact ? "py-1 text-xs" : "py-1.5 text-xs",
                    isActive
                      ? "bg-gold text-neutral-900 shadow-sm font-bold"
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
              "rounded-xl border border-gold/40 bg-gold/15 text-gold hover:bg-gold hover:text-neutral-900 transition-all font-bold flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed",
              isCompact ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
            )}
            title="Exportar Extrato em formato CSV"
          >
            <Download
              size={isCompact ? 14 : 16}
              className={isExporting ? "animate-bounce" : ""}
            />
            {isExporting ? "Exportando..." : "Exportar CSV"}
          </button>
        }
      />

      {/* TABELA DE TRANSAÇÕES */}
      <div
        className={cn(
          "flex flex-col gap-4 transition-opacity duration-200",
          isNavigating && "opacity-50 pointer-events-none",
        )}
      >
        <HistoryTable
          transactions={filteredTransactions}
          isCompact={isCompact}
          onDelete={handleDeleteTransaction}
        />

        {/* PAGINAÇÃO REUTILIZADA */}
        <TaskPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalElements}
          itemsPerPage={pageData.size || 8}
          itemLabel="transações"
        />
      </div>
    </div>
  );
}
