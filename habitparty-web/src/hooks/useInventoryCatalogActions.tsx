"use client";

import { Flame, PackageOpen, Trash2, Undo2, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  type Dispatch,
  type MouseEvent,
  type SetStateAction,
  useCallback,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";
import {
  consumeInventoryItem,
  discardInventoryItem,
  returnItemToBackpack,
  sendItemToFocus,
} from "@/actions/inventoryActions";
import type { ContextMenuItem } from "@/components/ui/ContextMenu";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useInFlightSet } from "@/hooks/useInFlightSet";
import type {
  InventoryItem,
  InventoryItemType,
  MysteryBoxOpenResult,
} from "@/types/inventory";
import type { PackageLevel, RewardType } from "@/types/reward";
import { getInventoryItemActionMeta } from "@/utils/inventoryHelpers";
import { resolveOpenedMysteryBoxMetadata } from "@/utils/inventoryMapper";
import {
  BACKEND_TO_UI_PACKAGE,
  BACKEND_TO_UI_REWARD_TYPE,
} from "@/utils/rewardMapper";
import { soundEffects } from "@/utils/soundEffects";

interface UseInventoryCatalogActionsParams {
  items: InventoryItem[];
  setItems: Dispatch<SetStateAction<InventoryItem[]>>;
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
      const nextIds =
        item.itemIds && item.itemIds.length > 1
          ? physicalItemId
            ? item.itemIds.filter((id) => id !== physicalItemId)
            : item.itemIds.slice(1)
          : item.itemIds;
      const nextPrimaryId = nextIds?.[0] || item.id;
      return {
        ...item,
        id: nextPrimaryId,
        inventoryItemId: nextPrimaryId,
        itemIds: nextIds,
        quantity: nextQty,
      };
    })
    .filter((item) => item.quantity > 0);
}

export function useInventoryCatalogActions({
  items,
  setItems,
}: UseInventoryCatalogActionsParams) {
  const router = useRouter();
  const t = useTranslations("inventory.container");
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
  const isUsing = usingItemIds.size > 0;
  const isSendingToFocus = sendingItemIds.size > 0;
  const isReturningToBackpack = returningItemIds.size > 0;
  const [openingBoxItem, setOpeningBoxItem] = useState<InventoryItem | null>(
    null,
  );
  const openingBoxItemRef = useRef<InventoryItem | null>(null);
  openingBoxItemRef.current = openingBoxItem;

  const [itemToDiscard, setItemToDiscard] = useState<InventoryItem | null>(
    null,
  );
  const [isDiscarding, startDiscardTransition] = useTransition();

  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    item: InventoryItem | null;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    item: null,
  });

  const handleOpenMysteryBox = useCallback((item: InventoryItem) => {
    setOpeningBoxItem(item);
  }, []);

  const handleCloseMysteryBox = useCallback(() => {
    setOpeningBoxItem(null);
  }, []);

  const handleMysteryBoxOpened = useCallback(
    (result: MysteryBoxOpenResult) => {
      const openedId = result.inventoryItemId;
      const sourceBox = openingBoxItemRef.current;
      if (!openedId && !sourceBox) return;

      setItems((prev) => {
        const targetGroupId = sourceBox?.id || openedId || "";
        const withoutOpenedBox = removePhysicalItemFromStack(
          prev,
          targetGroupId,
          openedId,
        );

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
          typeof result.remainingSeconds === "number"
            ? result.remainingSeconds
            : typeof result.remainingMinutes === "number" &&
                result.remainingMinutes > 0
              ? result.remainingMinutes * 60
              : undefined;
        const prizeTitle = result.rewardName || sourceBox?.reward.title || "";
        const prizeIcon = result.rewardIcon || "gift";
        const prizeRewardId =
          result.rewardId || sourceBox?.reward.id || openedId || "";
        const physicalPrizeId = openedId || `won-${Date.now()}`;

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
          return withoutOpenedBox.map((i, idx) =>
            idx === existingStackIdx
              ? {
                  ...i,
                  quantity: i.quantity + 1,
                  itemIds: [...(i.itemIds ?? [i.id]), physicalPrizeId],
                }
              : i,
          );
        }

        const openedMeta = resolveOpenedMysteryBoxMetadata({
          prizeName: prizeTitle,
          sourceBoxReward: sourceBox?.reward,
          packageLevel: mappedPkg,
        });

        const newPrizeItem: InventoryItem = {
          id: physicalPrizeId,
          itemIds: [physicalPrizeId],
          inventoryItemId: physicalPrizeId,
          orderIndex: sourceBox?.orderIndex ?? 0,
          name: prizeTitle,
          description: openedMeta.description,
          itemType: rawType,
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
              typeof result.remainingMinutes === "number" &&
              result.remainingMinutes > 0
                ? result.remainingMinutes
                : resolvedRemainingSeconds !== undefined
                  ? Math.max(1, Math.ceil(resolvedRemainingSeconds / 60))
                  : undefined,
            iconName: prizeIcon,
            icon: prizeIcon,
            packageLevel: mappedPkg,
          },
        };

        return [...withoutOpenedBox, newPrizeItem];
      });
    },
    [setItems],
  );

  const handleUseItem = useCallback(
    async (item: InventoryItem) => {
      if (isItemUsing(item.id) || isItemSending(item.id)) return;
      setItemUsing(item.id, true);
      const targetItemId = item.itemIds?.[0] || item.inventoryItemId || item.id;
      try {
        const res = await consumeInventoryItem(targetItemId);
        if (!res.success) {
          toast.error(res.error || t("toasts.useError"));
          return;
        }
        setItems((prev) =>
          removePhysicalItemFromStack(prev, item.id, targetItemId),
        );
        soundEffects.playTaskCompleteSound();
        toast.success(t("toasts.useSuccess", { title: item.reward.title }));
      } catch (_error) {
        toast.error(t("toasts.serverError"));
      } finally {
        setItemUsing(item.id, false);
      }
    },
    [isItemSending, isItemUsing, setItemUsing, setItems, t],
  );

  const handleSendToFocus = useCallback(
    async (item: InventoryItem) => {
      if (isItemSending(item.id) || isItemUsing(item.id)) return;
      setItemSending(item.id, true);
      const targetItemId = item.itemIds?.[0] || item.inventoryItemId || item.id;
      try {
        const res = await sendItemToFocus(targetItemId);
        if (!res.success) {
          toast.error(res.error || t("toasts.sendToFocusError"));
          return;
        }
        setItems((prev) => {
          const currentStack = prev.find(
            (i) =>
              i.id === item.id ||
              (targetItemId ? i.itemIds?.includes(targetItemId) : false),
          );
          if (!currentStack) return prev;

          if (currentStack.quantity <= 1) {
            return prev.map((i) =>
              i.id === currentStack.id ? { ...i, status: "IN_FOCUS" } : i,
            );
          }
          const decremented = removePhysicalItemFromStack(
            prev,
            currentStack.id,
            targetItemId,
          );
          const focusStackTarget = {
            status: "IN_FOCUS" as const,
            rewardId: currentStack.reward.id,
            type: currentStack.reward.type,
            packageLevel: currentStack.reward.packageLevel,
            normalizedTitle: currentStack.reward.title.trim().toLowerCase(),
            remainingSeconds: currentStack.remainingSeconds,
          };
          const existingFocusIdx = decremented.findIndex((i) =>
            isSameInventoryStackTarget(i, focusStackTarget),
          );
          if (existingFocusIdx >= 0) {
            return decremented.map((i, idx) =>
              idx === existingFocusIdx
                ? {
                    ...i,
                    quantity: i.quantity + 1,
                    itemIds: [...(i.itemIds ?? [i.id]), targetItemId],
                  }
                : i,
            );
          }
          return [
            ...decremented,
            {
              ...currentStack,
              id: targetItemId,
              inventoryItemId: targetItemId,
              itemIds: [targetItemId],
              quantity: 1,
              status: "IN_FOCUS",
            },
          ];
        });
        soundEffects.playTaskCompleteSound();
        toast.success(
          t("toasts.sendToFocusSuccess", { title: item.reward.title }),
        );
      } catch (_error) {
        toast.error(t("toasts.serverError"));
      } finally {
        setItemSending(item.id, false);
      }
    },
    [isItemSending, isItemUsing, setItemSending, setItems, t],
  );

  const handleItemContextMenu = useCallback(
    (e: MouseEvent, item: InventoryItem) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({
        isOpen: true,
        position: { x: e.clientX, y: e.clientY },
        item,
      });
    },
    [],
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleReturnToBackpack = useCallback(
    async (item: InventoryItem) => {
      if (isItemReturning(item.id)) return;
      setItemReturning(item.id, true);
      const targetItemId = item.itemIds?.[0] || item.inventoryItemId || item.id;
      try {
        const res = await returnItemToBackpack(targetItemId);
        if (!res.success) {
          toast.error(
            res.error ||
              (isGamified
                ? t("toasts.returnToBackpackErrorGamified")
                : t("toasts.returnToBackpackErrorProductivity")),
          );
          return;
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
        setItems((prev) => {
          const currentStack = prev.find(
            (i) =>
              i.id === item.id ||
              (targetItemId ? i.itemIds?.includes(targetItemId) : false),
          );
          if (!currentStack) return prev;

          const availableStackTarget = {
            status: "AVAILABLE" as const,
            rewardId: currentStack.reward.id,
            type: currentStack.reward.type,
            packageLevel: currentStack.reward.packageLevel,
            normalizedTitle: currentStack.reward.title.trim().toLowerCase(),
            remainingSeconds: currentStack.remainingSeconds,
          };
          const existingAvailableIdx = prev.findIndex(
            (i) =>
              i.id !== currentStack.id &&
              isSameInventoryStackTarget(i, availableStackTarget),
          );
          if (existingAvailableIdx >= 0) {
            const decremented = removePhysicalItemFromStack(
              prev,
              currentStack.id,
              targetItemId,
            );
            return decremented.map((i) =>
              isSameInventoryStackTarget(i, availableStackTarget)
                ? {
                    ...i,
                    quantity: i.quantity + 1,
                    itemIds: [...(i.itemIds ?? [i.id]), targetItemId],
                  }
                : i,
            );
          }
          if (currentStack.quantity > 1) {
            const decremented = removePhysicalItemFromStack(
              prev,
              currentStack.id,
              targetItemId,
            );
            return [
              ...decremented,
              {
                ...currentStack,
                id: targetItemId,
                inventoryItemId: targetItemId,
                itemIds: [targetItemId],
                quantity: 1,
                status: "AVAILABLE",
              },
            ];
          }
          return prev.map((i) =>
            i.id === currentStack.id ? { ...i, status: "AVAILABLE" } : i,
          );
        });
      } catch (_error) {
        toast.error(t("toasts.serverError"));
      } finally {
        setItemReturning(item.id, false);
      }
    },
    [isGamified, isItemReturning, setItemReturning, setItems, t],
  );

  const handleConfirmDiscard = useCallback(() => {
    if (!itemToDiscard) return;
    const target = itemToDiscard;
    const targetItemId =
      target.itemIds?.[0] || target.inventoryItemId || target.id;
    const previousItems = [...itemsRef.current];

    setItems((prev) =>
      removePhysicalItemFromStack(prev, target.id, targetItemId),
    );
    setItemToDiscard(null);

    startDiscardTransition(async () => {
      const res = await discardInventoryItem(targetItemId);
      if (res.success) {
        toast.success(
          t("toasts.discardSuccess", { title: target.reward.title }),
        );
      } else {
        setItems(previousItems);
        toast.error(res.error || t("toasts.discardError"));
      }
    });
  }, [itemToDiscard, setItems, t]);

  const contextMenuItems: ContextMenuItem[] = useMemo(() => {
    const target = contextMenu.item;
    if (!target) return [];

    const { isInFocus, isMystery, isCoupon } =
      getInventoryItemActionMeta(target);

    if (isInFocus) {
      return [
        {
          label: t("contextMenu.openInFocus"),
          icon: <Flame size={15} />,
          onClick: () => router.push("/focus?from=inventory"),
        },
        {
          label: isGamified
            ? t("contextMenu.returnToBackpackGamified")
            : t("contextMenu.returnToBackpackProductivity"),
          icon: <Undo2 size={15} />,
          disabled: returningItemIds.has(target.id),
          onClick: () => handleReturnToBackpack(target),
        },
      ];
    }

    const actions: ContextMenuItem[] = [];
    const targetBusy =
      usingItemIds.has(target.id) ||
      sendingItemIds.has(target.id) ||
      returningItemIds.has(target.id);

    if (isMystery) {
      actions.push({
        label: isGamified
          ? t("contextMenu.openMysteryBox")
          : t("contextMenu.openMysteryBoxProductivity"),
        icon: <PackageOpen size={15} />,
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
      onClick: () => setItemToDiscard(target),
    });

    return actions;
  }, [
    contextMenu.item,
    isGamified,
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
    isUsing,
    isSendingToFocus,
    usingItemIds,
    sendingItemIds,
    isReturningToBackpack,
    openingBoxItem,
    handleOpenMysteryBox,
    handleCloseMysteryBox,
    handleMysteryBoxOpened,
    itemToDiscard,
    setItemToDiscard,
    isDiscarding,
    handleConfirmDiscard,
    handleUseItem,
    handleSendToFocus,
    contextMenu,
    closeContextMenu,
    handleItemContextMenu,
    contextMenuItems,
  };
}
