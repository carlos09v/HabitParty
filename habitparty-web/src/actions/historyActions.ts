"use server";

import { updateTag } from "next/cache";
import { type ActionState, getErrorMessage } from "@/actions/types";
import { serverApi } from "@/api/server";
import {
  type GetHistoryParams,
  getHistoryData,
} from "@/services/historyService";
import { formatDateTime, resolveTransactionMetadata } from "@/utils";

function escapeCsvCell(value: string | number | null | undefined): string {
  const str = String(value ?? "");
  if (str.includes(";") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Exporta o extrato de transações em formato CSV respeitando os filtros ativos (aba, período e busca).
 */
export async function exportTransactionsCsvAction(
  filters?: Pick<GetHistoryParams, "tab" | "period" | "search">,
): Promise<ActionState<string>> {
  try {
    const hasActiveFilters =
      (filters?.tab && filters.tab !== "ALL") ||
      (filters?.period && filters.period !== "ALL") ||
      Boolean(filters?.search?.trim());

    if (hasActiveFilters) {
      const pageData = await getHistoryData({
        tab: filters?.tab,
        period: filters?.period,
        search: filters?.search,
        page: 1,
        size: 500,
      });

      const rows = pageData.content || [];
      const header = "Nome;Ouro;XP;Tipo;Dificuldade;Preço Original;Data";
      const lines = rows.map((tx) => {
        const meta = resolveTransactionMetadata(tx);
        const dateFormatted = formatDateTime(tx.createdAt, {
          includeSeconds: true,
          includeYearFull: true,
        });
        return [
          escapeCsvCell(tx.name || "Transação"),
          escapeCsvCell(tx.goldAmount ?? 0),
          escapeCsvCell(tx.xpAmount ?? 0),
          escapeCsvCell(meta.label),
          escapeCsvCell(meta.difficultyLabel || meta.packageLabel || "-"),
          escapeCsvCell(tx.priceSnapshot ?? ""),
          escapeCsvCell(dateFormatted),
        ].join(";");
      });

      return {
        success: true,
        data: [header, ...lines].join("\r\n"),
      };
    }

    const { data, error } = await serverApi.GET("/transactions/export", {
      parseAs: "text",
    });

    if (error || typeof data !== "string") {
      return {
        success: false,
        error: "Falha ao exportar arquivo CSV do extrato.",
      };
    }

    return { success: true, data };
  } catch (err) {
    console.error("[HistoryAction:ExportCsv]", err);
    return {
      success: false,
      error: "Erro ao gerar arquivo CSV.",
    };
  }
}

/**
 * Exclui um registro específico de transação
 */
export async function deleteTransactionAction(
  id: string,
): Promise<ActionState<void>> {
  try {
    const { error } = await serverApi.DELETE("/transactions/{id}", {
      params: {
        path: { id },
      },
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(
          error,
          "Falha ao remover o registro de transação.",
        ),
      };
    }

    updateTag("transactions");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[HistoryAction:Delete]", err);
    return {
      success: false,
      error: "Erro ao comunicar com servidor para exclusão.",
    };
  }
}
