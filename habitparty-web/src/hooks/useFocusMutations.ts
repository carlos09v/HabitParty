"use client";

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
import { soundEffects } from "@/utils/soundEffects";

interface UseFocusMutationsParams {
  activities: FocusActivity[];
  selectedActivityId?: string | null;
  activeTarget?: FocusActiveTarget | null;
  onSelectActivity?: (activityId: string | null) => void;
  onResetTarget: () => void;
  onSelectActivityTarget: (activity: FocusActivity | null) => void;
  onRefreshData: () => void;
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
  const [returnModalItem, setReturnModalItem] =
    useState<InventoryItemResponseDTO | null>(null);
  const [isReturningToBackpack, setIsReturningToBackpack] = useState(false);

  const [deleteModalActivity, setDeleteModalActivity] =
    useState<FocusActivity | null>(null);
  const [isDeletingActivity, setIsDeletingActivity] = useState(false);

  const handleConfirmDeleteActivity = useCallback(async () => {
    if (!deleteModalActivity) return;
    setIsDeletingActivity(true);
    try {
      const res = await deleteFocusActivity(deleteModalActivity.id, false);
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
        toast.success("Atividade excluída com sucesso.");
        setDeleteModalActivity(null);
        onRefreshData();
      } else {
        toast.error(res.error || "Erro ao excluir atividade.");
      }
    } catch {
      toast.error("Erro ao excluir atividade.");
    } finally {
      setIsDeletingActivity(false);
    }
  }, [
    deleteModalActivity,
    selectedActivityId,
    activeTarget?.id,
    activities,
    onSelectActivity,
    onResetTarget,
    onSelectActivityTarget,
    onRefreshData,
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
        toast.success("Item devolvido para a mochila.");
        setReturnModalItem(null);
        onRefreshData();
      } else {
        toast.error(res.error || "Erro ao devolver item para a mochila.");
      }
    } catch {
      toast.error("Erro ao devolver item para a mochila.");
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
            `🎉 Recompensa aproveitada com sucesso! "${item.rewardName || "Item"}" concluído!`,
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

          onRefreshData();
        } else {
          toast.error(res.error || "Erro ao concluir item.");
        }
      } catch {
        toast.error("Erro ao concluir item.");
      }
    },
    [
      activeTarget?.id,
      activities,
      onResetTarget,
      onSelectActivityTarget,
      onSelectActivity,
      onRefreshData,
    ],
  );

  return {
    returnModalItem,
    setReturnModalItem,
    isReturningToBackpack,
    handleConfirmReturnToBackpack,
    deleteModalActivity,
    setDeleteModalActivity,
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
  onSuccess: () => void,
) {
  const res = await deleteFocusRecord(recordId);
  if (res.success) {
    toast.success("Registro de foco removido com sucesso!");
    onSuccess();
  } else {
    toast.error(res.error || "Erro ao excluir registro de foco.");
  }
}
