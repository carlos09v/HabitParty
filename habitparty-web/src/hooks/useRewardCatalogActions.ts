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
import { useInFlightSet } from "@/hooks/useInFlightSet";
import { useUserStore } from "@/store/userStore";
import type { Reward, RewardCategory } from "@/types/reward";
import { extractRewardGroupBaseTitle } from "@/utils/rewardGrouping";
import {
  toCategoryMessageKey,
  toPackageMessageKey,
  toRewardTypeMessageKey,
} from "@/utils/rewardMapper";
import { soundEffects } from "@/utils/soundEffects";

export interface RewardPrefillDraft {
  title: string;
  description?: string;
  category: RewardCategory;
  type: "TimeBased";
  iconName: string;
  suggestedPackageLevel?: "Básico" | "Premium" | "Épico" | "Lendário";
}

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

  const {
    activeIds: redeemingRewardIds,
    has: isRewardRedeeming,
    setPending: setRewardRedeeming,
  } = useInFlightSet();
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [prefillDraft, setPrefillDraft] = useState<RewardPrefillDraft | null>(
    null,
  );
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
    async (reward: Reward, quantity = 1): Promise<boolean> => {
      if (isRewardRedeeming(reward.id)) return false;

      const isDebt = toCategoryMessageKey(reward.category) === "DEBT";
      const safeQuantity =
        isDebt && Number.isFinite(quantity) && quantity >= 1
          ? Math.min(50, Math.floor(quantity))
          : 1;
      const totalCost = reward.price * safeQuantity;

      const latestCoins = useUserStore.getState().user?.currentCoins;
      if (typeof latestCoins === "number" && latestCoins < totalCost) {
        toast.error(
          isGamified
            ? t("toasts.insufficientCoins")
            : t("toasts.insufficientCredits"),
        );
        return false;
      }

      setRewardRedeeming(reward.id, true);
      try {
        const res = await redeemReward(reward.id, safeQuantity);
        if (!res.success) {
          toast.error(res.error || t("toasts.redeemError"));
          return false;
        }

        const freshCoins = useUserStore.getState().user?.currentCoins;
        if (typeof freshCoins === "number") {
          const nextCoins = Math.max(
            0,
            Math.round((freshCoins - totalCost) * 100) / 100,
          );
          updateUserPartial({
            currentCoins: nextCoins,
          });
        }

        soundEffects.playBuySound();
        const displayTitle =
          isDebt && safeQuantity > 1
            ? `${reward.title} (${safeQuantity}x)`
            : reward.title;

        toast.success(
          isDebt
            ? isGamified
              ? t("toasts.debtPaidSuccessGamified", { title: displayTitle })
              : t("toasts.debtPaidSuccessProductivity", { title: displayTitle })
            : isGamified
              ? t("toasts.buySuccessGamified", { title: reward.title })
              : t("toasts.buySuccessProductivity", { title: reward.title }),
        );
        return true;
      } catch (_error) {
        toast.error(t("toasts.serverError"));
        return false;
      } finally {
        setRewardRedeeming(reward.id, false);
      }
    },
    [isGamified, isRewardRedeeming, setRewardRedeeming, updateUserPartial, t],
  );

  const handleAddProduct = useCallback(() => {
    setEditingReward(null);
    setPrefillDraft(null);
    setIsFormModalOpen(true);
  }, []);

  const handleCloseFormModal = useCallback(() => {
    setIsFormModalOpen(false);
    setEditingReward(null);
    setPrefillDraft(null);
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
    setPrefillDraft(null);
    setEditingReward(reward);
    setIsFormModalOpen(true);
  }, []);

  const [rewardToDelete, setRewardToDelete] = useState<Reward | null>(null);
  const [deleteRewardHistory, setDeleteRewardHistory] = useState(false);
  const {
    activeIds: checkingDeleteRewardIds,
    has: isRewardChecking,
    setPending: setRewardCheckingState,
  } = useInFlightSet();
  const rewardsRef = useRef(rewards);
  rewardsRef.current = rewards;

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
    if (!target || isRewardChecking(target.id)) return;

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
  }, [
    contextMenu.reward,
    executeDeleteReward,
    isRewardChecking,
    setRewardCheckingState,
  ]);

  const handleConfirmDeleteReward = useCallback(() => {
    const target = rewardToDelete;
    if (!target || isDeleting) return;

    startDeleteTransition(async () => {
      await executeDeleteReward(target, deleteRewardHistory);
    });
  }, [rewardToDelete, isDeleting, deleteRewardHistory, executeDeleteReward]);

  const handleAddPackageFromContextMenu = useCallback(() => {
    const target = contextMenu.reward;
    if (!target || toRewardTypeMessageKey(target.type) !== "TimeBased") return;

    const baseTitle = extractRewardGroupBaseTitle(target.title);
    const sameGroup = rewardsRef.current.filter(
      (r) =>
        toRewardTypeMessageKey(r.type) === "TimeBased" &&
        extractRewardGroupBaseTitle(r.title).toLowerCase() ===
          baseTitle.toLowerCase(),
    );
    const usedPackages = new Set(
      sameGroup.map((r) => toPackageMessageKey(r.packageLevel)),
    );
    const tierOrder: Array<{
      key: "BASIC" | "PREMIUM" | "EPIC" | "LEGENDARY";
      label: "Básico" | "Premium" | "Épico" | "Lendário";
    }> = [
      { key: "BASIC", label: "Básico" },
      { key: "PREMIUM", label: "Premium" },
      { key: "EPIC", label: "Épico" },
      { key: "LEGENDARY", label: "Lendário" },
    ];
    const nextTier =
      tierOrder.find((tier) => !usedPackages.has(tier.key))?.label ?? "Premium";

    setEditingReward(null);
    setPrefillDraft({
      title: baseTitle,
      description: target.description || undefined,
      category: target.category,
      type: "TimeBased",
      iconName: target.icon || target.iconName || "gamepad",
      suggestedPackageLevel: nextTier,
    });
    setIsFormModalOpen(true);
  }, [contextMenu.reward]);

  const handleRewardSuccess = useCallback(
    (saved: Reward | Reward[]) => {
      const savedList = Array.isArray(saved) ? saved : [saved];
      setRewards((prev) => {
        const savedById = new Map(
          savedList.map((reward) => [reward.id, reward]),
        );
        const next = prev.map(
          (existing) => savedById.get(existing.id) ?? existing,
        );
        const existingIds = new Set(prev.map((reward) => reward.id));
        const newRewards = savedList.filter(
          (reward) => !existingIds.has(reward.id),
        );
        return [...newRewards, ...next];
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
    handleAddPackageFromContextMenu,
    handleDeleteFromContextMenu,
    checkingDeleteRewardIds,
    rewardToDelete,
    setRewardToDelete,
    deleteRewardHistory,
    setDeleteRewardHistory,
    handleConfirmDeleteReward,
    isFormModalOpen,
    editingReward,
    prefillDraft,
    handleAddProduct,
    handleCloseFormModal,
    handleRewardSuccess,
    isDeleting,
    redeemingRewardIds,
    handleBuy,
  };
}
