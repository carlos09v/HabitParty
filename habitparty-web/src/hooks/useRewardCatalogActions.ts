"use client";

import { useRouter } from "next/navigation";
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
  checkRewardGroupHasHistory,
  checkRewardHasHistory,
  deleteReward,
  deleteRewardGroup,
  redeemReward,
} from "@/actions/rewardActions";
import { MAX_REWARD_PACKAGES_PER_CARD } from "@/constants/reward";
import { useContextMenu } from "@/hooks/useContextMenu";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useInFlightSet } from "@/hooks/useInFlightSet";
import { useUserStore } from "@/store/userStore";
import type {
  Reward,
  RewardCategory,
  RewardGroupContext,
} from "@/types/reward";
import {
  extractRewardGroupBaseTitle,
  isDebtReward,
  normalizeRewardTitleKey,
  sortRewardsWithDebtsFirst,
} from "@/utils/rewardGrouping";
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
  type: "TimeBased" | "SingleUse" | "MysteryBox";
  icon: string;
  price?: number;
  baseDurationMinutes?: number;
  suggestedPackageLevel?: "Básico" | "Premium" | "Épico" | "Lendário";
}

export interface RewardEditingGroup extends RewardGroupContext {
  activeVariantId?: string;
}

export interface RewardToDelete {
  reward: Reward;
  hasHistory: boolean;
}

export interface RewardGroupToDelete extends RewardGroupContext {
  hasHistory: boolean;
}

interface UseRewardCatalogActionsParams {
  rewards: Reward[];
  setRewards: Dispatch<SetStateAction<Reward[]>>;
  fallbackCoins?: number;
  onRewardBought?: (reward: Reward) => void;
}

export function useRewardCatalogActions({
  rewards,
  setRewards,
  fallbackCoins,
  onRewardBought,
}: UseRewardCatalogActionsParams) {
  const t = useTranslations("rewards.container");
  const router = useRouter();
  const { isGamified } = useExperienceMode();

  const storeUser = useUserStore((s) => s.user);
  const currentCoins = storeUser ? storeUser.currentCoins : undefined;
  const updateUserPartial = useUserStore((s) => s.updateUserPartial);

  const {
    activeIds: redeemingRewardIds,
    has: isRewardRedeeming,
    setPending: setRewardRedeeming,
  } = useInFlightSet();
  // Lock global por sessão de compra para impedir double-spend simultâneo em múltiplos cards
  const isRedeemingAnyRef = useRef(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [editingGroup, setEditingGroup] = useState<RewardEditingGroup | null>(
    null,
  );
  const [prefillDraft, setPrefillDraft] = useState<RewardPrefillDraft | null>(
    null,
  );
  const [isDeleting, startDeleteTransition] = useTransition();

  const {
    contextMenu: rawContextMenu,
    openContextMenu,
    closeContextMenu,
  } = useContextMenu<{ reward: Reward; groupContext?: RewardGroupContext }>();

  const contextMenu = {
    isOpen: rawContextMenu.isOpen,
    position: rawContextMenu.position,
    reward: rawContextMenu.data?.reward ?? null,
    groupContext: rawContextMenu.data?.groupContext,
  };

  const handleBuy = useCallback(
    async (reward: Reward): Promise<boolean> => {
      if (isRedeemingAnyRef.current || isRewardRedeeming(reward.id)) {
        return false;
      }

      const isDebt = isDebtReward(reward);
      const totalCost = reward.price;

      const preAwaitCoins =
        useUserStore.getState().user?.currentCoins ?? fallbackCoins;
      if (typeof preAwaitCoins === "number" && preAwaitCoins < totalCost) {
        toast.error(
          isGamified
            ? t("toasts.insufficientCoins")
            : t("toasts.insufficientCredits"),
        );
        return false;
      }

      isRedeemingAnyRef.current = true;
      setRewardRedeeming(reward.id, true);
      try {
        const res = await redeemReward(reward.id);
        if (!res.success) {
          toast.error(res.error || t("toasts.redeemError"));
          return false;
        }

        const freshCoins = useUserStore.getState().user?.currentCoins;
        // Só aplica débito otimista se o RSC ainda não tiver reidratado o novo saldo
        if (
          typeof freshCoins === "number" &&
          typeof preAwaitCoins === "number" &&
          freshCoins === preAwaitCoins
        ) {
          const nextCoins = Math.max(
            0,
            Math.round((freshCoins - totalCost) * 100) / 100,
          );
          updateUserPartial({
            currentCoins: nextCoins,
          });
        }

        // Dívida é descartável: ao quitar, é removida automaticamente da vitrine
        if (isDebt) {
          setRewards((prev) => prev.filter((item) => item.id !== reward.id));
        } else {
          onRewardBought?.(reward);
          useUserStore.getState().triggerAchievementCheck();
        }

        soundEffects.playBuySound();

        toast.success(
          isDebt
            ? isGamified
              ? t("toasts.debtPaidSuccessGamified", { title: reward.title })
              : t("toasts.debtPaidSuccessProductivity", {
                  title: reward.title,
                })
            : isGamified
              ? t("toasts.buySuccessGamified", { title: reward.title })
              : t("toasts.buySuccessProductivity", { title: reward.title }),
          isDebt
            ? undefined
            : {
                action: {
                  label: isGamified
                    ? t("toasts.openBackpackAction")
                    : t("toasts.openInventoryAction"),
                  onClick: () => router.push("/inventory"),
                },
              },
        );
        return true;
      } catch (_error) {
        toast.error(t("toasts.serverError"));
        return false;
      } finally {
        isRedeemingAnyRef.current = false;
        setRewardRedeeming(reward.id, false);
      }
    },
    [
      fallbackCoins,
      isGamified,
      isRewardRedeeming,
      onRewardBought,
      router,
      setRewardRedeeming,
      setRewards,
      updateUserPartial,
      t,
    ],
  );

  const handleAddProduct = useCallback(() => {
    setEditingReward(null);
    setEditingGroup(null);
    setPrefillDraft(null);
    setIsFormModalOpen(true);
  }, []);

  const handleOpenTemplateDraft = useCallback((draft: RewardPrefillDraft) => {
    setEditingReward(null);
    setEditingGroup(null);
    setPrefillDraft(draft);
    setIsFormModalOpen(true);
  }, []);

  const handleAddDebt = useCallback(() => {
    setEditingReward(null);
    setEditingGroup(null);
    setPrefillDraft({
      title: "",
      category: "Dívida",
      type: "SingleUse",
      icon: "receipt",
    });
    setIsFormModalOpen(true);
  }, []);

  const handleCloseFormModal = useCallback(() => {
    setIsFormModalOpen(false);
    setEditingReward(null);
    setEditingGroup(null);
    setPrefillDraft(null);
  }, []);

  const handleContextMenu = useCallback(
    (e: MouseEvent, reward: Reward, groupContext?: RewardGroupContext) => {
      openContextMenu(e, { reward, groupContext });
    },
    [openContextMenu],
  );

  const handleEditReward = useCallback(
    (reward: Reward, groupContext?: RewardGroupContext) => {
      setPrefillDraft(null);
      if (groupContext && groupContext.variants.length > 1) {
        setEditingReward(null);
        setEditingGroup({
          ...groupContext,
          activeVariantId: reward.id,
        });
      } else {
        setEditingGroup(null);
        setEditingReward(reward);
      }
      setIsFormModalOpen(true);
    },
    [],
  );

  const [rewardToDelete, setRewardToDelete] = useState<RewardToDelete | null>(
    null,
  );
  const [deleteRewardHistory, setDeleteRewardHistory] = useState(false);
  const [groupToDelete, setGroupToDelete] =
    useState<RewardGroupToDelete | null>(null);
  const [deleteGroupHistory, setDeleteGroupHistory] = useState(false);
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
        setRewardToDelete((prev) =>
          prev?.reward.id === target.id ? null : prev,
        );
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
        return sortRewardsWithDebtsFirst(next);
      });
      toast.error(res.error || t("toasts.deleteError"));
      return false;
    },
    [setRewards, t],
  );

  const handleEditFromContextMenu = useCallback(() => {
    if (contextMenu.reward) {
      handleEditReward(contextMenu.reward, contextMenu.groupContext);
    }
  }, [contextMenu.reward, contextMenu.groupContext, handleEditReward]);

  const handleDeleteFromContextMenu = useCallback(async () => {
    const target = contextMenu.reward;
    if (!target || isRewardChecking(target.id)) return;

    setRewardCheckingState(target.id, true);
    try {
      const res = await checkRewardHasHistory(target.id);
      const hasHistory = !res.success || Boolean(res.data);

      // Sempre exibe confirmação explícita antes de excluir, mostrando a opção de apagar histórico apenas se houver registros
      setDeleteRewardHistory(false);
      setRewardToDelete({ reward: target, hasHistory });
    } finally {
      setRewardCheckingState(target.id, false);
    }
  }, [contextMenu.reward, isRewardChecking, setRewardCheckingState]);

  const handleDeleteGroupFromContextMenu = useCallback(async () => {
    const group = contextMenu.groupContext;
    if (!group || group.variants.length <= 1) return;
    const ids = group.variants.map((v) => v.id);
    if (ids.some((id) => isRewardChecking(id))) return;

    for (const id of ids) {
      setRewardCheckingState(id, true);
    }
    try {
      const res = await checkRewardGroupHasHistory(ids);
      const hasHistory = !res.success || Boolean(res.data);
      setDeleteGroupHistory(false);
      setGroupToDelete({
        ...group,
        hasHistory,
      });
    } finally {
      for (const id of ids) {
        setRewardCheckingState(id, false);
      }
    }
  }, [contextMenu.groupContext, isRewardChecking, setRewardCheckingState]);

  const handleConfirmDeleteReward = useCallback(() => {
    const target = rewardToDelete;
    if (!target || isDeleting) return;

    startDeleteTransition(async () => {
      await executeDeleteReward(
        target.reward,
        target.hasHistory ? deleteRewardHistory : false,
      );
    });
  }, [rewardToDelete, isDeleting, deleteRewardHistory, executeDeleteReward]);

  const handleConfirmDeleteGroup = useCallback(() => {
    const targetGroup = groupToDelete;
    if (!targetGroup || isDeleting) return;

    startDeleteTransition(async () => {
      const ids = targetGroup.variants.map((v) => v.id);
      const idSet = new Set(ids);
      const firstRemovedIdx = rewardsRef.current.findIndex((r) =>
        idSet.has(r.id),
      );
      const removedVariants = rewardsRef.current.filter((r) => idSet.has(r.id));

      setRewards((prev) => prev.filter((r) => !idSet.has(r.id)));
      const res = await deleteRewardGroup(
        ids,
        targetGroup.hasHistory ? deleteGroupHistory : false,
      );
      if (res.success) {
        toast.success(
          t("toasts.deleteGroupSuccess", {
            title: targetGroup.displayTitle,
            count: targetGroup.variants.length,
          }),
        );
        setGroupToDelete(null);
        return;
      }

      // Rollback cirúrgico: reinsere apenas os itens removidos preservando mutações concorrentes
      setRewards((prev) => {
        const existingIds = new Set(prev.map((r) => r.id));
        const toRestore = removedVariants.filter((v) => !existingIds.has(v.id));
        if (toRestore.length === 0) return prev;
        const next = [...prev];
        const insertAt =
          firstRemovedIdx >= 0 && firstRemovedIdx <= next.length
            ? firstRemovedIdx
            : next.length;
        next.splice(insertAt, 0, ...toRestore);
        return sortRewardsWithDebtsFirst(next);
      });
      toast.error(res.error || t("toasts.deleteError"));
    });
  }, [groupToDelete, isDeleting, deleteGroupHistory, setRewards, t]);

  const handleAddPackageFromContextMenu = useCallback(() => {
    const target = contextMenu.reward;
    if (!target || isDebtReward(target)) return;
    const targetTypeKey = toRewardTypeMessageKey(target.type);
    if (targetTypeKey !== "TimeBased" && targetTypeKey !== "SingleUse") return;

    const targetCategoryKey = toCategoryMessageKey(target.category);
    const baseTitle = extractRewardGroupBaseTitle(target.title);
    const normalizedBase = normalizeRewardTitleKey(baseTitle);
    const sameGroup =
      contextMenu.groupContext?.variants ??
      rewardsRef.current.filter(
        (r) =>
          !isDebtReward(r) &&
          toRewardTypeMessageKey(r.type) === targetTypeKey &&
          toCategoryMessageKey(r.category) === targetCategoryKey &&
          normalizeRewardTitleKey(extractRewardGroupBaseTitle(r.title)) ===
            normalizedBase,
      );
    if (sameGroup.length >= MAX_REWARD_PACKAGES_PER_CARD) return;

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
    setEditingGroup(null);
    setPrefillDraft({
      title: baseTitle,
      description: target.description || undefined,
      category: target.category,
      type: targetTypeKey,
      icon: target.icon || "gamepad",
      suggestedPackageLevel: nextTier,
    });
    setIsFormModalOpen(true);
  }, [contextMenu.reward, contextMenu.groupContext]);

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
        const newRewards = savedList
          .filter((reward) => !existingIds.has(reward.id))
          .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
        return sortRewardsWithDebtsFirst([...next, ...newRewards]);
      });
    },
    [setRewards],
  );

  const handleRewardGroupSuccess = useCallback(
    (sourceIds: string[], savedRewards: Reward[]) => {
      const sourceSet = new Set(sourceIds);
      setRewards((prev) => {
        const firstIdx = prev.findIndex((item) => sourceSet.has(item.id));
        const remaining = prev.filter((item) => !sourceSet.has(item.id));
        if (firstIdx === -1) {
          return sortRewardsWithDebtsFirst([...savedRewards, ...remaining]);
        }
        const safeIdx = Math.min(firstIdx, remaining.length);
        const next = [...remaining];
        next.splice(safeIdx, 0, ...savedRewards);
        return sortRewardsWithDebtsFirst(next);
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
    handleDeleteGroupFromContextMenu,
    checkingDeleteRewardIds,
    rewardToDelete,
    setRewardToDelete,
    deleteRewardHistory,
    setDeleteRewardHistory,
    handleConfirmDeleteReward,
    groupToDelete,
    setGroupToDelete,
    deleteGroupHistory,
    setDeleteGroupHistory,
    handleConfirmDeleteGroup,
    isFormModalOpen,
    editingReward,
    editingGroup,
    prefillDraft,
    handleAddProduct,
    handleOpenTemplateDraft,
    handleAddDebt,
    handleCloseFormModal,
    handleRewardSuccess,
    handleRewardGroupSuccess,
    isDeleting,
    redeemingRewardIds,
    handleBuy,
  };
}
