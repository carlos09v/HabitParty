"use client";

import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { createFocusRecord, deleteFocusActivity } from "@/actions/focusActions";
import {
  consumeInventoryItem,
  returnItemToBackpack,
} from "@/actions/inventoryActions";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useInFlightSet } from "@/hooks/useInFlightSet";
import { useUserStore } from "@/store/userStore";
import type {
  FocusActiveTarget,
  FocusActivity,
  FocusActivityDeletionSummaryResponseDTO,
} from "@/types/focus";
import type { InventoryItemResponseDTO } from "@/types/inventory";
import { triggerCelebrationConfetti } from "@/utils/confetti";
import { getTodayDateString, toLocalISOString } from "@/utils/date";
import { deductUserPenalty } from "@/utils/gamification";
import { soundEffects } from "@/utils/soundEffects";

interface UseFocusMutationsParams {
  activities: FocusActivity[];
  todayDurationByActivityId?: Record<string, number>;
  selectedActivityId?: string | null;
  activeTarget?: FocusActiveTarget | null;
  onSelectActivity?: (activityId: string | null) => void;
  onResetTarget: () => void;
  onSelectActivityTarget: (activity: FocusActivity | null) => void;
  onActivityDeleted?: (activityId: string, deleteHistory: boolean) => void;
}

/**
 * Hook dedicado às mutações de atividades e itens de mochila em foco.
 * Extrai a lógica imperativa de exclusão, devolução e consumo de dentro do FocusMain.
 */
export function useFocusMutations({
  activities,
  todayDurationByActivityId,
  selectedActivityId,
  activeTarget,
  onSelectActivity,
  onResetTarget,
  onSelectActivityTarget,
  onActivityDeleted,
}: UseFocusMutationsParams) {
  const t = useTranslations("focus.main.toasts");
  const { isGamified } = useExperienceMode();
  const [returnModalItem, setReturnModalItem] =
    useState<InventoryItemResponseDTO | null>(null);
  const [isReturningToBackpack, setIsReturningToBackpack] = useState(false);
  const {
    activeIds: consumingItemIds,
    has: isItemConsuming,
    setPending: setItemConsuming,
  } = useInFlightSet();

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

  const resetAndFallbackTarget = useCallback(
    (excludedActivityId?: string) => {
      onResetTarget();
      const remainingActivities = excludedActivityId
        ? activities.filter((a) => a.id !== excludedActivityId)
        : activities;
      if (remainingActivities.length > 0) {
        onSelectActivityTarget(remainingActivities[0]);
        onSelectActivity?.(remainingActivities[0].id);
      } else {
        onSelectActivity?.(null);
      }
    },
    [activities, onResetTarget, onSelectActivityTarget, onSelectActivity],
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
          if (shouldDeleteHistory) {
            if (
              summary &&
              (summary.totalXpEarned > 0 || summary.totalCoinsEarned > 0)
            ) {
              deductUserPenalty(
                summary.totalXpEarned,
                summary.totalCoinsEarned,
              );
            }
            const deletedTodayMinutes =
              todayDurationByActivityId?.[deletingActivity.id] ?? 0;
            if (deletedTodayMinutes > 0) {
              const userTimeZone = useUserStore.getState().user?.timezone;
              useUserStore
                .getState()
                .adjustFocusMinutesToday(
                  -deletedTodayMinutes,
                  getTodayDateString(new Date(), userTimeZone),
                );
            }
          }
          if (selectedActivityId === deletingActivity.id) {
            onSelectActivity?.(null);
          }
          if (activeTarget?.id === deletingActivity.id) {
            resetAndFallbackTarget(deletingActivity.id);
          }
          onActivityDeleted?.(deletingActivity.id, shouldDeleteHistory);
          toast.success(t("deleteActivitySuccess"));
          setDeleteModalActivity(null);
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
      todayDurationByActivityId,
      selectedActivityId,
      activeTarget?.id,
      onSelectActivity,
      resetAndFallbackTarget,
      onActivityDeleted,
      t,
    ],
  );

  const handleConfirmReturnToBackpack = useCallback(async () => {
    if (!returnModalItem?.inventoryItemId) return;
    setIsReturningToBackpack(true);
    const errorFallback = t(
      isGamified ? "returnItemErrorGamified" : "returnItemErrorProductivity",
    );
    try {
      const res = await returnItemToBackpack(returnModalItem.inventoryItemId);
      if (res.success) {
        if (activeTarget?.id === returnModalItem.inventoryItemId) {
          resetAndFallbackTarget();
        }
        toast.success(
          t(
            isGamified
              ? "returnItemSuccessGamified"
              : "returnItemSuccessProductivity",
          ),
        );
        setReturnModalItem(null);
      } else {
        toast.error(res.error || errorFallback);
      }
    } catch {
      toast.error(errorFallback);
    } finally {
      setIsReturningToBackpack(false);
    }
  }, [
    returnModalItem,
    activeTarget?.id,
    resetAndFallbackTarget,
    isGamified,
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
          if (!focusRes.success) {
            toast.error(focusRes.error || t("consumeItemError"));
            return;
          }
          useUserStore.getState().triggerAchievementCheck();
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
            resetAndFallbackTarget();
          }
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
      isItemConsuming,
      resetAndFallbackTarget,
      setItemConsuming,
      t,
    ],
  );

  return {
    returnModalItem,
    setReturnModalItem,
    isReturningToBackpack,
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
