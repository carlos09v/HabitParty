"use server";

import { getTranslations } from "next-intl/server";
import { invalidateHistoryDomainTags } from "@/actions/cacheInvalidation";
import { type ActionState, getErrorMessage } from "@/actions/types";
import { serverApi } from "@/api/server";

export interface TransactionBatchMutationResult {
  affectedCount: number;
  ids: string[];
}

/**
 * Oculta logicamente vários registros de transação de uma vez (seleção múltipla no Histórico).
 * Preserva a integridade operacional de streaks, limites diários e retrospectiva.
 */
export async function deleteTransactionsBatchAction(
  ids: string[],
): Promise<ActionState<TransactionBatchMutationResult>> {
  const t = await getTranslations("history.actions");
  if (ids.length === 0) {
    return { success: true, data: { affectedCount: 0, ids: [] } };
  }
  try {
    const { data, error } = await serverApi.DELETE("/transactions/batch", {
      body: { ids },
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("deleteBatchFailed")),
      };
    }

    invalidateHistoryDomainTags();
    return {
      success: true,
      data: {
        affectedCount: data?.affectedCount ?? ids.length,
        ids,
      },
    };
  } catch (err) {
    console.error("[HistoryAction:DeleteBatch]", err);
    return {
      success: false,
      error: t("deleteUnexpectedError"),
    };
  }
}

/**
 * Oculta logicamente um registro específico de transação do extrato.
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

    invalidateHistoryDomainTags();
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[HistoryAction:Delete]", err);
    return {
      success: false,
      error: t("deleteUnexpectedError"),
    };
  }
}

/**
 * Restaura registros ocultados do extrato (suporte à ação Desfazer / Undo).
 */
export async function restoreTransactionsBatchAction(
  ids: string[],
): Promise<ActionState<TransactionBatchMutationResult>> {
  const t = await getTranslations("history.actions");
  if (ids.length === 0) {
    return { success: true, data: { affectedCount: 0, ids: [] } };
  }
  try {
    const { data, error } = await serverApi.POST("/transactions/restore", {
      body: { ids },
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("restoreFailed")),
      };
    }

    invalidateHistoryDomainTags();
    return {
      success: true,
      data: {
        affectedCount: data?.affectedCount ?? ids.length,
        ids,
      },
    };
  } catch (err) {
    console.error("[HistoryAction:RestoreBatch]", err);
    return {
      success: false,
      error: t("restoreUnexpectedError"),
    };
  }
}
