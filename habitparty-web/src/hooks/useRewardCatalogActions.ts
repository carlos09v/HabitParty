"use client";

import { useTranslations } from "next-intl";
import {
  type Dispatch,
  type MouseEvent,
  type SetStateAction,
  useCallback,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";
import { deleteReward, redeemReward } from "@/actions/rewardActions";
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

  const handleEditFromContextMenu = useCallback(() => {
    if (contextMenu.reward) {
      handleEditReward(contextMenu.reward);
    }
  }, [contextMenu.reward, handleEditReward]);

  const handleDeleteFromContextMenu = useCallback(() => {
    const target = contextMenu.reward;
    if (!target || isDeleting) return;

    const previousRewards = [...rewards];
    setRewards((prev) => prev.filter((r) => r.id !== target.id));

    startDeleteTransition(async () => {
      const res = await deleteReward(target.id);
      if (res.success) {
        toast.success(t("toasts.deleteSuccess", { title: target.title }));
      } else {
        setRewards(previousRewards);
        toast.error(res.error || t("toasts.deleteError"));
      }
    });
  }, [contextMenu.reward, isDeleting, rewards, setRewards, t]);

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
    isFormModalOpen,
    editingReward,
    handleAddProduct,
    handleCloseFormModal,
    handleRewardSuccess,
    isDeleting,
    handleBuy,
  };
}
