"use client";

import { useMemo } from "react";
import { useOptimisticDashboardStore } from "@/store/optimisticDashboardStore";
import type { DashboardTransactionSummary } from "@/types/dashboard";

/**
 * Combina transações hidratadas do servidor com transações otimistas pendentes na store,
 * mantendo referência estável quando não há deltas otimistas.
 */
export function useMergedOptimisticTransactions(
  transactions: DashboardTransactionSummary[],
): DashboardTransactionSummary[] {
  const optimisticTransactions = useOptimisticDashboardStore(
    (s) => s.transactions,
  );

  return useMemo(
    () =>
      optimisticTransactions.length > 0
        ? [...transactions, ...optimisticTransactions]
        : transactions,
    [transactions, optimisticTransactions],
  );
}
