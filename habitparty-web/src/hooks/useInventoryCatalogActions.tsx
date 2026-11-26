"use client";

import {
  CheckCircle2,
  Flame,
  PackageOpen,
  Trash2,
  Undo2,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import {
  consumeInventoryItem,
  discardInventoryItem,
  returnItemToBackpack,
  sendItemToFocus,
} from "@/actions/inventoryActions";
import type { ContextMenuItem } from "@/components/ui/ContextMenu";
import { useContextMenu } from "@/hooks/useContextMenu";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useInFlightSet } from "@/hooks/useInFlightSet";
import { useFocusTimerStore } from "@/store/focusTimerStore";
import type {
  InventoryItem,
  InventoryItemType,
  MysteryBoxOpenResult,
} from "@/types/inventory";
import type { PackageLevel, RewardType } from "@/types/reward";
import { getInventoryItemActionMeta } from "@/utils/inventoryHelpers";
import {
  buildInventoryStackKey,
  createBuiltInDropDescriptionResolver,
  resolveOpenedMysteryBoxMetadata,
} from "@/utils/inventoryMapper";
import {
  BACKEND_TO_UI_PACKAGE,
  BACKEND_TO_UI_REWARD_TYPE,
  UI_TO_BACKEND_PACKAGE,
  UI_TO_BACKEND_REWARD_TYPE,
} from "@/utils/rewardMapper";
import { soundEffects } from "@/utils/soundEffects";

interface UseInventoryCatalogActionsParams {
  items: InventoryItem[];
  setItems: Dispatch<SetStateAction<InventoryItem[]>>;
}

function getInventoryInFlightKey(
  item: Pick<InventoryItem, "id" | "stackKey">,
): string {
  return item.stackKey ?? item.id;
}

function sortStacksByOrderIndex(stacks: InventoryItem[]): InventoryItem[] {
  return [...stacks].sort(
    (a, b) =>
      (a.orderIndex ?? Number.MAX_SAFE_INTEGER) -
      (b.orderIndex ?? Number.MAX_SAFE_INTEGER),
  );
}

function isSameInventoryStackTarget(
  candidate: InventoryItem,
  target: {
    status: InventoryItem["status"];
    rewardId: string;
    type: RewardType;
    packageLevel?: PackageLevel;
    normalizedTitle: string;
    remainingSeconds?: number | null;
  },
): boolean {
  return (
    candidate.status === target.status &&
    candidate.reward.id === target.rewardId &&
    candidate.reward.type === target.type &&
    (candidate.reward.packageLevel ?? "Nenhum") ===
      (target.packageLevel ?? "Nenhum") &&
    candidate.reward.title.trim().toLowerCase() === target.normalizedTitle &&
    (candidate.remainingSeconds ?? null) === (target.remainingSeconds ?? null)
  );
}

function removePhysicalItemFromStack(
  items: InventoryItem[],
  groupId: string,
  physicalItemId?: string,
): InventoryItem[] {
  return items
    .map((item) => {
      const matchesGroup =
        item.id === groupId ||
        (physicalItemId ? item.itemIds?.includes(physicalItemId) : false);
      if (!matchesGroup) return item;

      const nextQty = item.quantity - 1;
      if (nextQty <= 0) {
        return { ...item, quantity: 0 };
      }

      const hasList = Boolean(item.itemIds && item.itemIds.length > 1);
      let nextIds = item.itemIds;
      let nextOrderIndexes = item.itemOrderIndexes;
      if (hasList && item.itemIds) {
        const removeIdx = physicalItemId
          ? item.itemIds.indexOf(physicalItemId)
          : -1;
        const targetIdx = removeIdx >= 0 ? removeIdx : 0;
        nextIds = item.itemIds.filter((_, idx) => idx !== targetIdx);
        if (item.itemOrderIndexes) {
          nextOrderIndexes = item.itemOrderIndexes.filter(
            (_, idx) => idx !== targetIdx,
          );
        }
      }

      const nextPrimaryId = nextIds?.[0] || item.id;
      return {
        ...item,
        id: nextPrimaryId,
        inventoryItemId: nextPrimaryId,
        orderIndex: nextOrderIndexes?.[0] ?? item.orderIndex,
        itemIds: nextIds,
        itemOrderIndexes: nextOrderIndexes,
        quantity: nextQty,
      };
    })
    .filter((item) => item.quantity > 0);
}

function movePhysicalItemToStatus(
  items: InventoryItem[],
  groupId: string,
  physicalItemId: string,
  targetStatus: "AVAILABLE" | "IN_FOCUS",
): InventoryItem[] {
  const currentStack = items.find(
    (i) => i.id === groupId || i.itemIds?.includes(physicalItemId),
  );
  if (!currentStack) return items;

  const physicalIdx = currentStack.itemIds?.indexOf(physicalItemId) ?? 0;
  const physicalOrderIndex =
    currentStack.itemOrderIndexes?.[physicalIdx >= 0 ? physicalIdx : 0] ??
    currentStack.orderIndex ??
    0;

  const stackTarget = {
    status: targetStatus,
    rewardId: currentStack.reward.id,
    type: currentStack.reward.type,
    packageLevel: currentStack.reward.packageLevel,
    normalizedTitle: currentStack.reward.title.trim().toLowerCase(),
    remainingSeconds: currentStack.remainingSeconds,
  };

  const existingTargetStack = items.find(
    (i) =>
      i.id !== currentStack.id && isSameInventoryStackTarget(i, stackTarget),
  );

  if (existingTargetStack) {
    const decremented = removePhysicalItemFromStack(
      items,
      currentStack.id,
      physicalItemId,
    );
    return sortStacksByOrderIndex(
      decremented.map((i) =>
        i.id === existingTargetStack.id
          ? {
              ...i,
              quantity: i.quantity + 1,
              orderIndex: Math.min(
                i.orderIndex ?? physicalOrderIndex,
                physicalOrderIndex,
              ),
              itemIds: [...(i.itemIds ?? [i.id]), physicalItemId],
              itemOrderIndexes: [
                ...(i.itemOrderIndexes ?? [i.orderIndex ?? 0]),
                physicalOrderIndex,
              ],
            }
          : i,
      ),
    );
  }

  const nextStackKey = buildInventoryStackKey({
    rewardId: currentStack.reward.id,
    rawType:
      UI_TO_BACKEND_REWARD_TYPE[currentStack.reward.type] || "SINGLE_USE",
    packageKey:
      UI_TO_BACKEND_PACKAGE[currentStack.reward.packageLevel || "Nenhum"] ||
      "NONE",
    title: currentStack.reward.title,
    status: targetStatus,
    remainingSeconds: currentStack.remainingSeconds,
  });

  if (currentStack.quantity <= 1) {
    return sortStacksByOrderIndex(
      items.map((i) =>
        i.id === currentStack.id
          ? { ...i, status: targetStatus, stackKey: nextStackKey }
          : i,
      ),
    );
  }

  const decremented = removePhysicalItemFromStack(
    items,
    currentStack.id,
    physicalItemId,
  );
  return sortStacksByOrderIndex([
    ...decremented,
    {
      ...currentStack,
      id: physicalItemId,
      stackKey: nextStackKey,
      inventoryItemId: physicalItemId,
      orderIndex: physicalOrderIndex,
      itemIds: [physicalItemId],
      itemOrderIndexes: [physicalOrderIndex],
      quantity: 1,
      status: targetStatus,
    },
  ]);
}

function findLiveMysteryBoxStack(
  items: InventoryItem[],
  openingBox: InventoryItem,
): InventoryItem | undefined {
  return items.find(
    (i) =>
      i.reward.type === "MysteryBox" &&
      ((openingBox.stackKey && i.stackKey === openingBox.stackKey) ||
        i.id === openingBox.id ||
        i.reward.id === openingBox.reward.id),
  );
}

export function useInventoryCatalogActions({
  items,
  setItems,
}: UseInventoryCatalogActionsParams) {
  const router = useRouter();
  const t = useTranslations("inventory.container");
  const tMysteryTiers = useTranslations("rewards.mysteryBox.tiers");
  const { isGamified } = useExperienceMode();

  const itemsRef = useRef(items);
  itemsRef.current = items;

  const {
    activeIds: usingItemIds,
    has: isItemUsing,
    setPending: setItemUsing,
  } = useInFlightSet();
  const {
    activeIds: sendingItemIds,
    has: isItemSending,
    setPending: setItemSending,
  } = useInFlightSet();
  const {
    activeIds: returningItemIds,
    has: isItemReturning,
    setPending: setItemReturning,
  } = useInFlightSet();

  const [openingBoxItem, setOpeningBoxItem] = useState<InventoryItem | null>(
    null,
  );
  const [lastWonInventoryItem, setLastWonInventoryItem] =
    useState<InventoryItem | null>(null);
  const openingBoxItemRef = useRef<InventoryItem | null>(null);
  openingBoxItemRef.current = openingBoxItem;

  const [itemToDiscard, setItemToDiscard] = useState<InventoryItem | null>(
    null,
  );
  const [isDiscarding, setIsDiscarding] = useState(false);

  const [activeReturnConfirm, setActiveReturnConfirm] = useState<{
    item: InventoryItem;
    physicalItemId: string;
  } | null>(null);
  const [isReturningActive, setIsReturningActive] = useState(false);

  const {
    contextMenu: rawContextMenu,
    openContextMenu: handleItemContextMenu,
    closeContextMenu,
  } = useContextMenu<InventoryItem>();

  const contextMenu = {
    isOpen: rawContextMenu.isOpen,
    position: rawContextMenu.position,
    item: rawContextMenu.data,
  };

  const resolveDropDescription = useMemo(
    () => createBuiltInDropDescriptionResolver(tMysteryTiers),
    [tMysteryTiers],
  );

  const handleOpenMysteryBox = useCallback((item: InventoryItem) => {
    setLastWonInventoryItem(null);
    setOpeningBoxItem(item);
  }, []);

  const handleCloseMysteryBox = useCallback(() => {
    setOpeningBoxItem(null);
    setLastWonInventoryItem(null);
  }, []);

  const remainingBoxesInOpeningStack = useMemo(() => {
    if (!openingBoxItem) return 0;
    const liveStack = findLiveMysteryBoxStack(items, openingBoxItem);
    return liveStack?.quantity ?? 0;
  }, [items, openingBoxItem]);

  const handleOpenNextMysteryBox = useCallback(() => {
    if (!openingBoxItem) return;
    const liveStack = findLiveMysteryBoxStack(itemsRef.current, openingBoxItem);
    if (!liveStack || liveStack.quantity <= 0) {
      handleCloseMysteryBox();
      return;
    }
    setLastWonInventoryItem(null);
    setOpeningBoxItem(liveStack);
  }, [openingBoxItem, handleCloseMysteryBox]);

  const handleMysteryBoxOpened = useCallback(
    (result: MysteryBoxOpenResult) => {
      const openedId = result.inventoryItemId;
      const sourceBox = openingBoxItemRef.current;
      if (!openedId && !sourceBox) return;

      const targetGroupId = sourceBox?.id || openedId || "";
      const consumedBoxItemId =
        sourceBox?.itemIds?.[0] || sourceBox?.inventoryItemId || openedId;

      const rawType: InventoryItemType =
        result.rewardType === "TIME_BASED" ||
        result.rewardType === "SINGLE_USE" ||
        result.rewardType === "MISTERY_BOX"
          ? result.rewardType
          : typeof result.remainingMinutes === "number" &&
              result.remainingMinutes > 0
            ? "TIME_BASED"
            : "SINGLE_USE";
      const mappedType = BACKEND_TO_UI_REWARD_TYPE[rawType] || "SingleUse";
      const mappedPkg = result.rewardPackageLevel
        ? BACKEND_TO_UI_PACKAGE[result.rewardPackageLevel]
        : sourceBox?.reward.packageLevel;
      const resolvedRemainingSeconds =
        mappedType === "TimeBased"
          ? typeof result.remainingSeconds === "number"
            ? result.remainingSeconds
            : typeof result.remainingMinutes === "number" &&
                result.remainingMinutes > 0
              ? result.remainingMinutes * 60
              : undefined
          : undefined;
      const prizeTitle = result.rewardName || sourceBox?.reward.title || "";
      const prizeIcon = result.rewardIcon || "gift";
      const prizeRewardId =
        result.rewardId || sourceBox?.reward.id || openedId || "";
      const physicalPrizeId =
        openedId || consumedBoxItemId || `won-${Date.now()}`;

      const openedMeta = resolveOpenedMysteryBoxMetadata({
        prizeName: prizeTitle,
        sourceBoxReward: sourceBox?.reward,
        getDropDescription: resolveDropDescription,
      });

      const prizeStackKey = buildInventoryStackKey({
        rewardId: prizeRewardId,
        rawType,
        packageKey: result.rewardPackageLevel || "NONE",
        title: prizeTitle,
        status: "AVAILABLE",
        remainingSeconds: resolvedRemainingSeconds,
      });

      const constructedWonItem: InventoryItem = {
        id: physicalPrizeId,
        stackKey: prizeStackKey,
        itemIds: [physicalPrizeId],
        itemOrderIndexes: [
          sourceBox?.itemOrderIndexes?.[0] ?? sourceBox?.orderIndex ?? 0,
        ],
        inventoryItemId: physicalPrizeId,
        orderIndex:
          sourceBox?.itemOrderIndexes?.[0] ?? sourceBox?.orderIndex ?? 0,
        status: "AVAILABLE",
        quantity: 1,
        remainingSeconds: resolvedRemainingSeconds,
        reward: {
          id: prizeRewardId,
          title: prizeTitle,
          description: openedMeta.description,
          type: mappedType,
          category: openedMeta.category,
          price: result.rewardPrice ?? sourceBox?.reward.price ?? 0,
          baseDurationMinutes:
            mappedType !== "TimeBased"
              ? undefined
              : typeof result.remainingMinutes === "number" &&
                  result.remainingMinutes > 0
                ? result.remainingMinutes
                : resolvedRemainingSeconds !== undefined
                  ? Math.max(1, Math.ceil(resolvedRemainingSeconds / 60))
                  : undefined,
          icon: prizeIcon,
          packageLevel: mappedPkg,
        },
      };

      setLastWonInventoryItem(constructedWonItem);

      setItems((prev) => {
        const sourceBoxIndex = prev.findIndex(
          (i) =>
            i.id === targetGroupId ||
            (consumedBoxItemId
              ? i.itemIds?.includes(consumedBoxItemId)
              : false),
        );
        const sourceStackBefore =
          sourceBoxIndex >= 0 ? prev[sourceBoxIndex] : sourceBox;
        const consumedOrderIndex =
          sourceStackBefore?.itemOrderIndexes?.[0] ??
          sourceStackBefore?.orderIndex ??
          0;

        const withoutOpenedBox = removePhysicalItemFromStack(
          prev,
          targetGroupId,
          consumedBoxItemId,
        );

        const prizeStackTarget = {
          status: "AVAILABLE" as const,
          rewardId: prizeRewardId,
          type: mappedType,
          packageLevel: mappedPkg,
          normalizedTitle: prizeTitle.trim().toLowerCase(),
          remainingSeconds: resolvedRemainingSeconds,
        };
        const existingStackIdx = withoutOpenedBox.findIndex((i) =>
          isSameInventoryStackTarget(i, prizeStackTarget),
        );

        if (existingStackIdx >= 0) {
          return sortStacksByOrderIndex(
            withoutOpenedBox.map((i, idx) =>
              idx === existingStackIdx
                ? {
                    ...i,
                    quantity: i.quantity + 1,
                    orderIndex: Math.min(
                      i.orderIndex ?? consumedOrderIndex,
                      consumedOrderIndex,
                    ),
                    itemIds: [...(i.itemIds ?? [i.id]), physicalPrizeId],
                    itemOrderIndexes: [
                      ...(i.itemOrderIndexes ?? [i.orderIndex ?? 0]),
                      consumedOrderIndex,
                    ],
                  }
                : i,
            ),
          );
        }

        const newPrizeItem: InventoryItem = {
          ...constructedWonItem,
          orderIndex: consumedOrderIndex,
          itemOrderIndexes: [consumedOrderIndex],
        };

        return sortStacksByOrderIndex([...withoutOpenedBox, newPrizeItem]);
      });
    },
    [resolveDropDescription, setItems],
  );

  const handleUseItem = useCallback(
    async (item: InventoryItem) => {
      const inFlightKey = getInventoryInFlightKey(item);
      if (
        isItemUsing(inFlightKey) ||
        isItemSending(inFlightKey) ||
        isItemReturning(inFlightKey)
      ) {
        return;
      }
      setItemUsing(inFlightKey, true);
      const targetItemId = item.itemIds?.[0] || item.inventoryItemId || item.id;
      try {
        const res = await consumeInventoryItem(targetItemId);
        if (!res.success) {
          toast.error(res.error || t("toasts.useError"));
          return;
        }
        const timerState = useFocusTimerStore.getState();
        if (
          timerState.target?.type === "inventory" &&
          timerState.target.id === targetItemId
        ) {
          timerState.resetTarget();
        }
        setItems((prev) =>
          removePhysicalItemFromStack(prev, item.id, targetItemId),
        );
        soundEffects.playTaskCompleteSound();
        toast.success(t("toasts.useSuccess", { title: item.reward.title }));
      } catch (_error) {
        toast.error(t("toasts.serverError"));
      } finally {
        setItemUsing(inFlightKey, false);
      }
    },
    [isItemReturning, isItemSending, isItemUsing, setItemUsing, setItems, t],
  );

  const handleSendToFocus = useCallback(
    async (item: InventoryItem) => {
      const inFlightKey = getInventoryInFlightKey(item);
      if (
        isItemSending(inFlightKey) ||
        isItemUsing(inFlightKey) ||
        isItemReturning(inFlightKey)
      ) {
        return;
      }
      setItemSending(inFlightKey, true);
      const targetItemId = item.itemIds?.[0] || item.inventoryItemId || item.id;
      try {
        const res = await sendItemToFocus(targetItemId);
        if (!res.success) {
          toast.error(res.error || t("toasts.sendToFocusError"));
          return;
        }
        setItems((prev) =>
          movePhysicalItemToStatus(prev, item.id, targetItemId, "IN_FOCUS"),
        );
        soundEffects.playTaskCompleteSound();
        toast.success(
          t("toasts.sendToFocusSuccess", { title: item.reward.title }),
          {
            action: {
              label: t("toasts.goToFocusAction"),
              onClick: () =>
                router.push(`/focus?from=inventory&itemId=${targetItemId}`),
            },
          },
        );
      } catch (_error) {
        toast.error(t("toasts.serverError"));
      } finally {
        setItemSending(inFlightKey, false);
      }
    },
    [
      isItemReturning,
      isItemSending,
      isItemUsing,
      router,
      setItemSending,
      setItems,
      t,
    ],
  );

  const executeReturnToBackpack = useCallback(
    async (
      item: InventoryItem,
      physicalItemId: string,
      shouldResetTimer: boolean,
    ) => {
      const inFlightKey = getInventoryInFlightKey(item);
      if (isItemReturning(inFlightKey)) return false;
      setItemReturning(inFlightKey, true);
      try {
        const res = await returnItemToBackpack(physicalItemId);
        if (!res.success) {
          toast.error(
            res.error ||
              (isGamified
                ? t("toasts.returnToBackpackErrorGamified")
                : t("toasts.returnToBackpackErrorProductivity")),
          );
          return false;
        }

        if (shouldResetTimer) {
          useFocusTimerStore.getState().resetTarget();
        }

        soundEffects.playTaskCompleteSound();
        toast.success(
          isGamified
            ? t("toasts.returnToBackpackSuccessGamified", {
                title: item.reward.title,
              })
            : t("toasts.returnToBackpackSuccessProductivity", {
                title: item.reward.title,
              }),
        );
        setItems((prev) =>
          movePhysicalItemToStatus(prev, item.id, physicalItemId, "AVAILABLE"),
        );
        return true;
      } catch (_error) {
        toast.error(t("toasts.serverError"));
        return false;
      } finally {
        setItemReturning(inFlightKey, false);
      }
    },
    [isGamified, isItemReturning, setItemReturning, setItems, t],
  );

  const handleReturnToBackpack = useCallback(
    async (item: InventoryItem) => {
      const inFlightKey = getInventoryInFlightKey(item);
      if (isItemReturning(inFlightKey)) return;

      const timerState = useFocusTimerStore.getState();
      const activeTimerItemId =
        timerState.target?.type === "inventory" ? timerState.target.id : null;
      const isTimerActive =
        timerState.isActive || timerState.elapsedSeconds > 0;

      const candidateIds = item.itemIds?.length
        ? item.itemIds
        : [item.inventoryItemId || item.id];

      // Prefere devolver um item ocioso da pilha quando houver mais de 1 unidade no palco
      const idleId = candidateIds.find((id) => id !== activeTimerItemId);
      const chosenId = idleId || candidateIds[0];

      if (
        activeTimerItemId &&
        chosenId === activeTimerItemId &&
        isTimerActive
      ) {
        setActiveReturnConfirm({ item, physicalItemId: chosenId });
        return;
      }

      const shouldResetLoadedIdle = Boolean(
        activeTimerItemId && chosenId === activeTimerItemId,
      );
      await executeReturnToBackpack(item, chosenId, shouldResetLoadedIdle);
    },
    [executeReturnToBackpack, isItemReturning],
  );

  const handleConfirmReturnActive = useCallback(async () => {
    if (!activeReturnConfirm || isReturningActive) return;
    setIsReturningActive(true);
    try {
      const ok = await executeReturnToBackpack(
        activeReturnConfirm.item,
        activeReturnConfirm.physicalItemId,
        true,
      );
      if (ok) {
        setActiveReturnConfirm(null);
      }
    } finally {
      setIsReturningActive(false);
    }
  }, [activeReturnConfirm, executeReturnToBackpack, isReturningActive]);

  const handleConfirmDiscard = useCallback(async () => {
    if (!itemToDiscard || isDiscarding) return;
    const target = itemToDiscard;
    const targetItemId =
      target.itemIds?.[0] || target.inventoryItemId || target.id;

    setIsDiscarding(true);
    try {
      const res = await discardInventoryItem(targetItemId);
      if (!res.success) {
        toast.error(res.error || t("toasts.discardError"));
        return;
      }

      setItems((prev) =>
        removePhysicalItemFromStack(prev, target.id, targetItemId),
      );
      setItemToDiscard(null);
      toast.success(t("toasts.discardSuccess", { title: target.reward.title }));
    } catch (_error) {
      toast.error(t("toasts.serverError"));
    } finally {
      setIsDiscarding(false);
    }
  }, [itemToDiscard, isDiscarding, setItems, t]);

  const contextMenuItems: ContextMenuItem[] = useMemo(() => {
    const target = contextMenu.item;
    if (!target) return [];

    const { isInFocus, isDepletedCoupon, isMystery, isCoupon } =
      getInventoryItemActionMeta(target);
    const targetInFlightKey = getInventoryInFlightKey(target);
    const targetBusy =
      usingItemIds.has(targetInFlightKey) ||
      sendingItemIds.has(targetInFlightKey) ||
      returningItemIds.has(targetInFlightKey) ||
      isDiscarding;

    if (isInFocus) {
      if (isDepletedCoupon) {
        return [
          {
            label: t("contextMenu.completeCoupon"),
            icon: <CheckCircle2 size={15} />,
            disabled: targetBusy,
            onClick: () => handleUseItem(target),
          },
        ];
      }

      const primaryPhysicalId =
        target.itemIds?.[0] || target.inventoryItemId || target.id;
      return [
        {
          label: t("contextMenu.openInFocus"),
          icon: <Flame size={15} />,
          onClick: () =>
            router.push(`/focus?from=inventory&itemId=${primaryPhysicalId}`),
        },
        {
          label: isGamified
            ? t("contextMenu.returnToBackpackGamified")
            : t("contextMenu.returnToBackpackProductivity"),
          icon: <Undo2 size={15} />,
          disabled: targetBusy,
          onClick: () => handleReturnToBackpack(target),
        },
      ];
    }

    const actions: ContextMenuItem[] = [];

    if (isDepletedCoupon) {
      actions.push({
        label: t("contextMenu.completeCoupon"),
        icon: <CheckCircle2 size={15} />,
        disabled: targetBusy,
        onClick: () => handleUseItem(target),
      });
    } else if (isMystery) {
      actions.push({
        label: isGamified
          ? t("contextMenu.openMysteryBox")
          : t("contextMenu.openMysteryBoxProductivity"),
        icon: <PackageOpen size={15} />,
        disabled: targetBusy,
        onClick: () => handleOpenMysteryBox(target),
      });
    } else if (isCoupon) {
      actions.push(
        {
          label: t("contextMenu.sendToFocus"),
          icon: <Flame size={15} />,
          disabled: targetBusy,
          onClick: () => handleSendToFocus(target),
        },
        {
          label: t("contextMenu.useImmediately"),
          icon: <Zap size={15} />,
          disabled: targetBusy,
          onClick: () => handleUseItem(target),
        },
      );
    } else {
      actions.push({
        label: t("contextMenu.useItem"),
        icon: <Zap size={15} />,
        disabled: targetBusy,
        onClick: () => handleUseItem(target),
      });
    }

    actions.push({
      label: t("contextMenu.discardItem"),
      icon: <Trash2 size={15} />,
      variant: "destructive",
      disabled: targetBusy,
      onClick: () => setItemToDiscard(target),
    });

    return actions;
  }, [
    contextMenu.item,
    isGamified,
    isDiscarding,
    returningItemIds,
    sendingItemIds,
    usingItemIds,
    t,
    router,
    handleReturnToBackpack,
    handleOpenMysteryBox,
    handleSendToFocus,
    handleUseItem,
  ]);

  return {
    usingItemIds,
    sendingItemIds,
    returningItemIds,
    openingBoxItem,
    lastWonInventoryItem,
    remainingBoxesInOpeningStack,
    handleOpenMysteryBox,
    handleOpenNextMysteryBox,
    handleCloseMysteryBox,
    handleMysteryBoxOpened,
    itemToDiscard,
    setItemToDiscard,
    isDiscarding,
    handleConfirmDiscard,
    activeReturnConfirm,
    setActiveReturnConfirm,
    isReturningActive,
    handleConfirmReturnActive,
    handleUseItem,
    handleSendToFocus,
    contextMenu,
    closeContextMenu,
    handleItemContextMenu,
    contextMenuItems,
  };
}
