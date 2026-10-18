"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { toast } from "sonner";
import { deleteTransactionAction } from "@/actions/historyActions";
import { TaskPagination } from "@/components/dashboard/TaskPagination";
import { WelcomeCard } from "@/components/ui/WelcomeCard";
import { WELCOME_CARD_DETAILS } from "@/constants/welcomeCards";
import { useCompactMode } from "@/hooks/useCompactMode";
import type { HistoryContainerProps } from "@/types/history";
import { calculateHistoryWelcomeStats } from "@/utils/catalogMetrics";
import { HistoryFilters } from "./HistoryFilters";
import { HistoryTable } from "./HistoryTable";

export function HistoryContainer({
  pageData,
  currentTab,
  currentPage,
  currentPeriod = "ALL",
  currentSearch = "",
  isCompact: propIsCompact,
  taskTypeMap,
}: HistoryContainerProps) {
  const router = useRouter();
  const { isCompact: hookIsCompact } = useCompactMode();
  const isCompact = propIsCompact ?? hookIsCompact;

  const transactions = pageData.content || [];
  const totalElements = pageData.totalElements ?? transactions.length;
  const totalPages =
    pageData.totalPages ??
    Math.max(1, Math.ceil(totalElements / (pageData.size || 8)));

  const { stats: historyStats } = useMemo(
    () => calculateHistoryWelcomeStats(transactions, totalElements),
    [transactions, totalElements],
  );

  const welcomeDetails = WELCOME_CARD_DETAILS.history;

  const handleDeleteTransaction = async (id: string) => {
    const res = await deleteTransactionAction(id);
    if (!res.success) {
      toast.error(res.error || "Erro ao excluir registro.");
      return;
    }
    toast.success("Registro removido com sucesso!");
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* WELCOME CARD DO EXTRATO COM MÉTRICAS */}
      {welcomeDetails && (
        <WelcomeCard
          compact={isCompact}
          title={welcomeDetails.title}
          subtitle={welcomeDetails.subtitle}
          bullets={welcomeDetails.bullets}
          imageSrc={welcomeDetails.imageSrc}
          stats={historyStats}
          imageWidth={
            isCompact ? welcomeDetails.compactWidth : welcomeDetails.normalWidth
          }
          imageHeight={
            isCompact
              ? welcomeDetails.compactHeight
              : welcomeDetails.normalHeight
          }
          storageKey="history"
        />
      )}

      {/* BARRA DE FILTROS REUTILIZÁVEL E CONECTADA À URL */}
      <HistoryFilters
        currentTab={currentTab}
        currentPeriod={currentPeriod}
        currentSearch={currentSearch}
        isCompact={isCompact}
      />

      {/* TABELA DE TRANSAÇÕES */}
      <div className="flex flex-col gap-4">
        <HistoryTable
          transactions={transactions}
          isCompact={isCompact}
          onDelete={handleDeleteTransaction}
          taskTypeMap={taskTypeMap}
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
