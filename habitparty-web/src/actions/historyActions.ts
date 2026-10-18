"use server";

import { updateTag } from "next/cache";
import { cookies } from "next/headers";
import { type ActionState, getErrorMessage } from "@/actions/types";
import { serverApi } from "@/api/server";
import type {
  PageTransactionHistoryResponseDTO,
  TransactionHistoryResponseDTO,
} from "@/types/history";

export type {
  PageTransactionHistoryResponseDTO,
  TransactionHistoryResponseDTO,
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/**
 * Exporta o extrato de transações em formato CSV
 */
export async function exportTransactionsCsvAction(): Promise<
  ActionState<string>
> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("habitparty_token")?.value;

    const res = await fetch(`${API_BASE_URL}/transactions/export`, {
      method: "GET",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return {
        success: false,
        error: "Falha ao exportar arquivo CSV do extrato.",
      };
    }

    const csvText = await res.text();
    return { success: true, data: csvText };
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
