"use client";

import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  createFocusRecord,
  deleteFocusActivity,
  deleteFocusRecord,
} from "@/actions/focusActions";
import {
  consumeInventoryItem,
  returnItemToBackpack,
} from "@/actions/inventoryActions";
import { useInFlightSet } from "@/hooks/useInFlightSet";
import { useUserStore } from "@/store/userStore";
import type {
  FocusActiveTarget,
  FocusActivity,
  FocusActivityDeletionSummaryResponseDTO,
  FocusRecord,
} from "@/types/focus";
import type { InventoryItemResponseDTO } from "@/types/inventory";
import { triggerCelebrationConfetti } from "@/utils/confetti";
import { toLocalISOString } from "@/utils/date";
import { getBrowserDocumentLocale } from "@/utils/focusTimerBrowser";
import { deductUserPenalty } from "@/utils/gamification";
import { soundEffects } from "@/utils/soundEffects";

interface UseFocusMutationsParams {
  activities: FocusActivity[];
  selectedActivityId?: string | null;
  activeTarget?: FocusActiveTarget | null;
  onSelectActivity?: (activityId: string | null) => void;
  onResetTarget: () => void;
  onSelectActivityTarget: (activity: FocusActivity | null) => void;
  onActivityDeleted?: (activityId: string, deleteHistory: boolean) => void;
  onRefreshData?: () => void;
}

/**
 * Hook dedicado às mutações de atividades, itens de mochila em foco e registros.
 * Extrai a lógica imperativa de exclusão, devolução e consumo de dentro do FocusMain.
 */
export function useFocusMutations({
  activities,
  selectedActivityId,
  activeTarget,
  onSelectActivity,
  onResetTarget,
  onSelectActivityTarget,
  onActivityDeleted,
  onRefreshData,
}: UseFocusMutationsParams) {
  const t = useTranslations("focus.main.toasts");
  const [returnModalItem, setReturnModalItem] =
    useState<InventoryItemResponseDTO | null>(null);
  const [isReturningToBackpack, setIsReturningToBackpack] = useState(false);
  const {
    activeIds: consumingItemIds,
    has: isItemConsuming,
    setPending: setItemConsuming,
  } = useInFlightSet();
  const isConsumingItem = consumingItemIds.size > 0;

  const [deleteModalActivity, setDeleteModalActivity] =
    useState<FocusActivity | null>(null);
  const [isDeletingActivity, setIsDeletingActivity] = useState(false);
  // Opção do modal: excluir também as sessões da atividade e seus registros no Histórico
  const [deleteActivityHistory, setDeleteActivityHistory] = useState(false);

  const openDeleteActivityModal = useCallback(
    (activity: FocusActivity | null) => {
      setDeleteActivityHistory(false);
      setDeleteModalActivity(activity);
    },
    [],
  );

  const handleConfirmDeleteActivity = useCallback(
    async (summary?: FocusActivityDeletionSummaryResponseDTO | null) => {
      if (!deleteModalActivity) return;
      const deletingActivity = deleteModalActivity;
      const shouldDeleteHistory = deleteActivityHistory;
      setIsDeletingActivity(true);
      try {
        const res = await deleteFocusActivity(
          deletingActivity.id,
          shouldDeleteHistory,
        );
        if (res.success) {
          if (
            shouldDeleteHistory &&
            summary &&
            (summary.totalXpEarned > 0 || summary.totalCoinsEarned > 0)
          ) {
            deductUserPenalty(summary.totalXpEarned, summary.totalCoinsEarned);
          }
          if (selectedActivityId === deletingActivity.id) {
            onSelectActivity?.(null);
          }
          if (activeTarget?.id === deletingActivity.id) {
            onResetTarget();
            const remainingActivities = activities.filter(
              (a) => a.id !== deletingActivity.id,
            );
            if (remainingActivities.length > 0) {
              onSelectActivityTarget(remainingActivities[0]);
              onSelectActivity?.(remainingActivities[0].id);
            } else {
              onSelectActivity?.(null);
            }
          }
          onActivityDeleted?.(deletingActivity.id, shouldDeleteHistory);
          toast.success(t("deleteActivitySuccess"));
          setDeleteModalActivity(null);
          onRefreshData?.();
        } else {
          toast.error(res.error || t("deleteActivityError"));
        }
      } catch {
        toast.error(t("deleteActivityError"));
      } finally {
        setIsDeletingActivity(false);
      }
    },
    [
      deleteModalActivity,
      deleteActivityHistory,
      selectedActivityId,
      activeTarget?.id,
      activities,
      onSelectActivity,
      onResetTarget,
      onSelectActivityTarget,
      onActivityDeleted,
      onRefreshData,
      t,
    ],
  );

  const handleConfirmReturnToBackpack = useCallback(async () => {
    if (!returnModalItem?.inventoryItemId) return;
    setIsReturningToBackpack(true);
    try {
      const res = await returnItemToBackpack(returnModalItem.inventoryItemId);
      if (res.success) {
        if (activeTarget?.id === returnModalItem.inventoryItemId) {
          onResetTarget();
          if (activities.length > 0) {
            onSelectActivityTarget(activities[0]);
            onSelectActivity?.(activities[0].id);
          } else {
            onSelectActivity?.(null);
          }
        }
        toast.success(t("returnItemSuccess"));
        setReturnModalItem(null);
        onRefreshData?.();
      } else {
        toast.error(res.error || t("returnItemError"));
      }
    } catch {
      toast.error(t("returnItemError"));
    } finally {
      setIsReturningToBackpack(false);
    }
  }, [
    returnModalItem,
    activeTarget?.id,
    activities,
    onResetTarget,
    onSelectActivityTarget,
    onSelectActivity,
    onRefreshData,
    t,
  ]);

  const handleConsumeItem = useCallback(
    async (item: InventoryItemResponseDTO) => {
      const itemId = item.inventoryItemId;
      if (!itemId || isItemConsuming(itemId)) return;
      setItemConsuming(itemId, true);
      try {
        // Registra sessão residual apenas quando há pelo menos 1 minuto restante
        // (remainingSeconds === 1 é a marcação do backend de cupom já zerado pronto para resgate)
        if (item.remainingSeconds && item.remainingSeconds >= 60) {
          const now = new Date();
          const userTimeZone = useUserStore.getState().user?.timezone;
          const endTime = toLocalISOString(now, userTimeZone);
          const startTime = toLocalISOString(
            new Date(now.getTime() - item.remainingSeconds * 1000),
            userTimeZone,
          );
          const focusRes = await createFocusRecord({
            inventoryItemId: itemId,
            recordType: "STOPWATCH",
            completedPomos: 0,
            startTime,
            endTime,
          });
          if (focusRes.success) {
            useUserStore.getState().triggerAchievementCheck();
          }
        }

        const res = await consumeInventoryItem(itemId);
        if (res.success) {
          soundEffects.playFocusSessionCompleteSound();
          triggerCelebrationConfetti();
          toast.success(
            t("consumeItemSuccess", {
              name: item.rewardName || t("consumeItemFallbackName"),
            }),
          );

          if (activeTarget?.id === itemId) {
            onResetTarget();
            if (activities.length > 0) {
              onSelectActivityTarget(activities[0]);
              onSelectActivity?.(activities[0].id);
            } else {
              onSelectActivity?.(null);
            }
          }

          onRefreshData?.();
        } else {
          toast.error(res.error || t("consumeItemError"));
        }
      } catch {
        toast.error(t("consumeItemError"));
      } finally {
        setItemConsuming(itemId, false);
      }
    },
    [
      activeTarget?.id,
      activities,
      isItemConsuming,
      onResetTarget,
      onSelectActivityTarget,
      onSelectActivity,
      onRefreshData,
      setItemConsuming,
      t,
    ],
  );

  return {
    returnModalItem,
    setReturnModalItem,
    isReturningToBackpack,
    isConsumingItem,
    consumingItemIds,
    handleConfirmReturnToBackpack,
    deleteModalActivity,
    setDeleteModalActivity: openDeleteActivityModal,
    deleteActivityHistory,
    setDeleteActivityHistory,
    isDeletingActivity,
    handleConfirmDeleteActivity,
    handleConsumeItem,
  };
}

/**
 * Helper para exclusão de registro de foco com feedback visual.
 */
export async function executeDeleteFocusRecord(
  recordId: string,
  messages?: {
    success?: string;
    error?: string;
  },
  onSuccess?: () => void,
  deleteHistory = false,
  deletedRecord?: Pick<
    FocusRecord,
    "inventoryItemId" | "xpEarned" | "coinsEarned"
  >,
) {
  const isEn = getBrowserDocumentLocale() === "en";
  const res = await deleteFocusRecord(recordId, deleteHistory);
  if (res.success) {
    if (
      deletedRecord &&
      !deletedRecord.inventoryItemId &&
      ((deletedRecord.xpEarned ?? 0) > 0 ||
        (deletedRecord.coinsEarned ?? 0) > 0)
    ) {
      deductUserPenalty(
        deletedRecord.xpEarned ?? 0,
        deletedRecord.coinsEarned ?? 0,
      );
    }
    toast.success(
      messages?.success ??
        (isEn
          ? "Focus record removed successfully!"
          : "Registro de foco removido com sucesso!"),
    );
    onSuccess?.();
  } else {
    toast.error(
      res.error ||
        messages?.error ||
        (isEn
          ? "Error deleting focus record."
          : "Erro ao excluir registro de foco."),
    );
  }
}
