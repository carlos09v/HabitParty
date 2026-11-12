"use server";

import { updateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { type ActionState, getErrorMessage } from "@/actions/types";
import { serverApi } from "@/api/server";
import type { GetHistoryParams } from "@/services/historyService";

/**
 * Exporta o extrato de transações em formato CSV diretamente pelo backend,
 * respeitando os filtros ativos (aba, período e busca) e garantindo sanitização contra CSV Injection.
 */
export async function exportTransactionsCsvAction(
  filters?: Pick<GetHistoryParams, "tab" | "period" | "search">,
): Promise<ActionState<string>> {
  const t = await getTranslations("history.actions");
  try {
    const query: Record<string, string> = {};
    if (filters?.tab && filters.tab !== "ALL") {
      query.tab = filters.tab;
    }
    if (filters?.period && filters.period !== "ALL") {
      query.period = filters.period;
    }
    if (filters?.search?.trim()) {
      query.search = filters.search.trim();
    }

    const { data, error } = await serverApi.GET("/transactions/export", {
      params: {
        query,
      },
      parseAs: "text",
    });

    if (error || typeof data !== "string") {
      return {
        success: false,
        error: getErrorMessage(error, t("exportCsvFailed")),
      };
    }

    return { success: true, data };
  } catch (err) {
    console.error("[HistoryAction:ExportCsv]", err);
    return {
      success: false,
      error: t("exportCsvUnexpectedError"),
    };
  }
}

/**
 * Exclui vários registros de transação de uma vez (seleção múltipla no Histórico)
 */
export async function deleteTransactionsBatchAction(
  ids: string[],
): Promise<ActionState<void>> {
  const t = await getTranslations("history.actions");
  if (ids.length === 0) {
    return { success: true, data: undefined };
  }
  try {
    const { error } = await serverApi.DELETE("/transactions/batch", {
      body: { ids },
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("deleteBatchFailed")),
      };
    }

    updateTag("transactions");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[HistoryAction:DeleteBatch]", err);
    return {
      success: false,
      error: t("deleteUnexpectedError"),
    };
  }
}

/**
 * Exclui um registro específico de transação
 */
export async function deleteTransactionAction(
  id: string,
): Promise<ActionState<void>> {
  const t = await getTranslations("history.actions");
  try {
    const { error } = await serverApi.DELETE("/transactions/{id}", {
      params: {
        path: { id },
      },
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("deleteFailed")),
      };
    }

    updateTag("transactions");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[HistoryAction:Delete]", err);
    return {
      success: false,
      error: t("deleteUnexpectedError"),
    };
  }
}
