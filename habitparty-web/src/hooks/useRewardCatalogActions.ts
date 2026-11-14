"use client";

import { useTranslations } from "next-intl";
import {
  type Dispatch,
  type MouseEvent,
  type SetStateAction,
  useCallback,
  useRef,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";
import {
  checkRewardHasHistory,
  deleteReward,
  redeemReward,
} from "@/actions/rewardActions";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useUserStore } from "@/store/userStore";
import type { Reward } from "@/types/reward";
import { soundEffects } from "@/utils/soundEffects";

interface UseRewardCatalogActionsParams {
  rewards: Reward[];
  setRewards: Dispatch<SetStateAction<Reward[]>>;
}

export function useRewardCatalogActions({
  rewards,
  setRewards,
}: UseRewardCatalogActionsParams) {
  const t = useTranslations("rewards.container");
  const { isGamified } = useExperienceMode();

  const currentCoins = useUserStore((s) => s.user?.currentCoins);
  const updateUserPartial = useUserStore((s) => s.updateUserPartial);

  const [isRedeeming, setIsRedeeming] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    reward: Reward | null;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    reward: null,
  });

  const handleBuy = useCallback(
    async (reward: Reward) => {
      if (isRedeeming) return;

      if (typeof currentCoins === "number" && currentCoins < reward.price) {
        toast.error(
          isGamified
            ? t("toasts.insufficientCoins")
            : t("toasts.insufficientCredits"),
        );
        return;
      }

      setIsRedeeming(true);
      try {
        const res = await redeemReward(reward.id);
        if (!res.success) {
          toast.error(res.error || t("toasts.redeemError"));
          return;
        }

        if (typeof currentCoins === "number") {
          const nextCoins = Math.max(
            0,
            Math.round((currentCoins - reward.price) * 100) / 100,
          );
          updateUserPartial({
            currentCoins: nextCoins,
          });
        }

        soundEffects.playBuySound();
        toast.success(
          isGamified
            ? t("toasts.buySuccessGamified", { title: reward.title })
            : t("toasts.buySuccessProductivity", { title: reward.title }),
        );
      } catch (_error) {
        toast.error(t("toasts.serverError"));
      } finally {
        setIsRedeeming(false);
      }
    },
    [isGamified, isRedeeming, currentCoins, updateUserPartial, t],
  );

  const handleAddProduct = useCallback(() => {
    setEditingReward(null);
    setIsFormModalOpen(true);
  }, []);

  const handleCloseFormModal = useCallback(() => {
    setIsFormModalOpen(false);
    setEditingReward(null);
  }, []);

  const handleContextMenu = useCallback((e: MouseEvent, reward: Reward) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      reward,
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleEditReward = useCallback((reward: Reward) => {
    setEditingReward(reward);
    setIsFormModalOpen(true);
  }, []);

  const [rewardToDelete, setRewardToDelete] = useState<Reward | null>(null);
  const [deleteRewardHistory, setDeleteRewardHistory] = useState(false);
  const [checkingDeleteRewardIds, setCheckingDeleteRewardIds] = useState<
    Set<string>
  >(() => new Set());
  const checkingIdsRef = useRef<Set<string>>(new Set());
  const rewardsRef = useRef(rewards);
  rewardsRef.current = rewards;

  const setRewardCheckingState = useCallback(
    (rewardId: string, isChecking: boolean) => {
      if (isChecking) {
        checkingIdsRef.current.add(rewardId);
      } else {
        checkingIdsRef.current.delete(rewardId);
      }
      setCheckingDeleteRewardIds(new Set(checkingIdsRef.current));
    },
    [],
  );

  const executeDeleteReward = useCallback(
    async (target: Reward, shouldDeleteHistory: boolean) => {
      const removedIndex = rewardsRef.current.findIndex(
        (r) => r.id === target.id,
      );
      setRewards((prev) => prev.filter((r) => r.id !== target.id));

      const res = await deleteReward(target.id, shouldDeleteHistory);
      if (res.success) {
        toast.success(t("toasts.deleteSuccess", { title: target.title }));
        setRewardToDelete((prev) => (prev?.id === target.id ? null : prev));
        return true;
      }

      setRewards((prev) => {
        if (prev.some((r) => r.id === target.id)) return prev;
        const next = [...prev];
        const insertAt =
          removedIndex >= 0 && removedIndex <= next.length
            ? removedIndex
            : next.length;
        next.splice(insertAt, 0, target);
        return next;
      });
      toast.error(res.error || t("toasts.deleteError"));
      return false;
    },
    [setRewards, t],
  );

  const handleEditFromContextMenu = useCallback(() => {
    if (contextMenu.reward) {
      handleEditReward(contextMenu.reward);
    }
  }, [contextMenu.reward, handleEditReward]);

  const handleDeleteFromContextMenu = useCallback(async () => {
    const target = contextMenu.reward;
    if (!target || checkingIdsRef.current.has(target.id)) return;

    setRewardCheckingState(target.id, true);
    try {
      const res = await checkRewardHasHistory(target.id);
      const hasHistory = !res.success || Boolean(res.data);

      if (hasHistory) {
        setDeleteRewardHistory(false);
        setRewardToDelete(target);
        return;
      }

      await executeDeleteReward(target, false);
    } finally {
      setRewardCheckingState(target.id, false);
    }
  }, [contextMenu.reward, executeDeleteReward, setRewardCheckingState]);

  const handleConfirmDeleteReward = useCallback(() => {
    const target = rewardToDelete;
    if (!target || isDeleting) return;

    startDeleteTransition(async () => {
      await executeDeleteReward(target, deleteRewardHistory);
    });
  }, [rewardToDelete, isDeleting, deleteRewardHistory, executeDeleteReward]);

  const handleRewardSuccess = useCallback(
    (savedReward: Reward) => {
      setRewards((prev) => {
        const exists = prev.some((r) => r.id === savedReward.id);
        if (exists) {
          return prev.map((r) => (r.id === savedReward.id ? savedReward : r));
        }
        return [savedReward, ...prev];
      });
    },
    [setRewards],
  );

  return {
    currentCoins,
    contextMenu,
    closeContextMenu,
    handleContextMenu,
    handleEditReward,
    handleEditFromContextMenu,
    handleDeleteFromContextMenu,
    checkingDeleteRewardIds,
    rewardToDelete,
    setRewardToDelete,
    deleteRewardHistory,
    setDeleteRewardHistory,
    handleConfirmDeleteReward,
    isFormModalOpen,
    editingReward,
    handleAddProduct,
    handleCloseFormModal,
    handleRewardSuccess,
    isDeleting,
    handleBuy,
  };
}
