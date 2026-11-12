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
import type { FocusActiveTarget, FocusActivity } from "@/types/focus";
import type { InventoryItemResponseDTO } from "@/types/inventory";
import { triggerCelebrationConfetti } from "@/utils/confetti";
import { toLocalISOString } from "@/utils/date";
import { getBrowserDocumentLocale } from "@/utils/focusTimerBrowser";
import { soundEffects } from "@/utils/soundEffects";

interface UseFocusMutationsParams {
  activities: FocusActivity[];
  selectedActivityId?: string | null;
  activeTarget?: FocusActiveTarget | null;
  onSelectActivity?: (activityId: string | null) => void;
  onResetTarget: () => void;
  onSelectActivityTarget: (activity: FocusActivity | null) => void;
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
  onRefreshData,
}: UseFocusMutationsParams) {
  const t = useTranslations("focus.main.toasts");
  const [returnModalItem, setReturnModalItem] =
    useState<InventoryItemResponseDTO | null>(null);
  const [isReturningToBackpack, setIsReturningToBackpack] = useState(false);

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

  const handleConfirmDeleteActivity = useCallback(async () => {
    if (!deleteModalActivity) return;
    setIsDeletingActivity(true);
    try {
      const res = await deleteFocusActivity(
        deleteModalActivity.id,
        deleteActivityHistory,
      );
      if (res.success) {
        if (selectedActivityId === deleteModalActivity.id) {
          onSelectActivity?.(null);
        }
        if (activeTarget?.id === deleteModalActivity.id) {
          onResetTarget();
          const remainingActivities = activities.filter(
            (a) => a.id !== deleteModalActivity.id,
          );
          if (remainingActivities.length > 0) {
            onSelectActivityTarget(remainingActivities[0]);
            onSelectActivity?.(remainingActivities[0].id);
          } else {
            onSelectActivity?.(null);
          }
        }
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
  }, [
    deleteModalActivity,
    deleteActivityHistory,
    selectedActivityId,
    activeTarget?.id,
    activities,
    onSelectActivity,
    onResetTarget,
    onSelectActivityTarget,
    onRefreshData,
    t,
  ]);

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
      if (!item.inventoryItemId) return;
      try {
        if (item.remainingSeconds && item.remainingSeconds > 0) {
          const now = new Date();
          const endTime = toLocalISOString(now);
          const startTime = toLocalISOString(
            new Date(now.getTime() - item.remainingSeconds * 1000),
          );
          await createFocusRecord({
            inventoryItemId: item.inventoryItemId,
            recordType: "STOPWATCH",
            completedPomos: 0,
            startTime,
            endTime,
          });
        }

        const res = await consumeInventoryItem(item.inventoryItemId);
        if (res.success) {
          soundEffects.playFocusSessionCompleteSound();
          triggerCelebrationConfetti();
          toast.success(
            t("consumeItemSuccess", {
              name: item.rewardName || t("consumeItemFallbackName"),
            }),
          );

          if (activeTarget?.id === item.inventoryItemId) {
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
      }
    },
    [
      activeTarget?.id,
      activities,
      onResetTarget,
      onSelectActivityTarget,
      onSelectActivity,
      onRefreshData,
      t,
    ],
  );

  return {
    returnModalItem,
    setReturnModalItem,
    isReturningToBackpack,
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
) {
  const isEn = getBrowserDocumentLocale() === "en";
  const res = await deleteFocusRecord(recordId, deleteHistory);
  if (res.success) {
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
