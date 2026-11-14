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
import type { InventoryItem } from "@/types/inventory";
import { getInventoryItemActionMeta } from "@/utils/inventoryHelpers";
import { soundEffects } from "@/utils/soundEffects";

interface UseInventoryCatalogActionsParams {
  items: InventoryItem[];
  setItems: Dispatch<SetStateAction<InventoryItem[]>>;
}

function decrementInventoryStack(
  items: InventoryItem[],
  groupId: string,
): InventoryItem[] {
  return items
    .map((item) => {
      if (item.id !== groupId) return item;
      const nextQty = item.quantity - 1;
      if (nextQty <= 0) {
        return { ...item, quantity: 0 };
      }
      const nextIds =
        item.itemIds && item.itemIds.length > 1
          ? item.itemIds.slice(1)
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

  const [isUsing, setIsUsing] = useState(false);
  const [isSendingToFocus, setIsSendingToFocus] = useState(false);
  const [isReturningToBackpack, setIsReturningToBackpack] = useState(false);
  const [openingBoxItem, setOpeningBoxItem] = useState<InventoryItem | null>(
    null,
  );
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

  const handleUseItem = useCallback(
    async (item: InventoryItem) => {
      if (isUsing) return;
      setIsUsing(true);
      const targetItemId = item.itemIds?.[0] || item.inventoryItemId || item.id;
      try {
        const res = await consumeInventoryItem(targetItemId);
        if (!res.success) {
          toast.error(res.error || t("toasts.useError"));
          return;
        }
        setItems((prev) => decrementInventoryStack(prev, item.id));
        soundEffects.playTaskCompleteSound();
        toast.success(t("toasts.useSuccess", { title: item.reward.title }));
      } catch (_error) {
        toast.error(t("toasts.serverError"));
      } finally {
        setIsUsing(false);
      }
    },
    [isUsing, setItems, t],
  );

  const handleSendToFocus = useCallback(
    async (item: InventoryItem) => {
      if (isSendingToFocus) return;
      setIsSendingToFocus(true);
      const targetItemId = item.itemIds?.[0] || item.inventoryItemId || item.id;
      try {
        const res = await sendItemToFocus(targetItemId);
        if (!res.success) {
          toast.error(res.error || t("toasts.sendToFocusError"));
          return;
        }
        setItems((prev) => {
          if (item.quantity <= 1) {
            return prev.map((i) =>
              i.id === item.id ? { ...i, status: "IN_FOCUS" } : i,
            );
          }
          const decremented = decrementInventoryStack(prev, item.id);
          const existingFocusIdx = decremented.findIndex(
            (i) =>
              i.status === "IN_FOCUS" &&
              i.reward.id === item.reward.id &&
              i.remainingSeconds === item.remainingSeconds,
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
              ...item,
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
        setIsSendingToFocus(false);
      }
    },
    [isSendingToFocus, setItems, t],
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
      if (isReturningToBackpack) return;
      setIsReturningToBackpack(true);
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
          const existingAvailableIdx = prev.findIndex(
            (i) =>
              i.id !== item.id &&
              i.status === "AVAILABLE" &&
              i.reward.id === item.reward.id &&
              i.remainingSeconds === item.remainingSeconds,
          );
          if (existingAvailableIdx >= 0) {
            const decremented = decrementInventoryStack(prev, item.id);
            return decremented.map((i) =>
              i.status === "AVAILABLE" &&
              i.reward.id === item.reward.id &&
              i.remainingSeconds === item.remainingSeconds
                ? {
                    ...i,
                    quantity: i.quantity + 1,
                    itemIds: [...(i.itemIds ?? [i.id]), targetItemId],
                  }
                : i,
            );
          }
          if (item.quantity > 1) {
            const decremented = decrementInventoryStack(prev, item.id);
            return [
              ...decremented,
              {
                ...item,
                id: targetItemId,
                inventoryItemId: targetItemId,
                itemIds: [targetItemId],
                quantity: 1,
                status: "AVAILABLE",
              },
            ];
          }
          return prev.map((i) =>
            i.id === item.id ? { ...i, status: "AVAILABLE" } : i,
          );
        });
      } catch (_error) {
        toast.error(t("toasts.serverError"));
      } finally {
        setIsReturningToBackpack(false);
      }
    },
    [isGamified, isReturningToBackpack, setItems, t],
  );

  const handleConfirmDiscard = useCallback(() => {
    if (!itemToDiscard) return;
    const target = itemToDiscard;
    const targetItemId =
      target.itemIds?.[0] || target.inventoryItemId || target.id;
    const previousItems = [...items];

    setItems((prev) => decrementInventoryStack(prev, target.id));
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
  }, [itemToDiscard, items, setItems, t]);

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
          onClick: () => router.push("/focus"),
        },
        {
          label: isGamified
            ? t("contextMenu.returnToBackpackGamified")
            : t("contextMenu.returnToBackpackProductivity"),
          icon: <Undo2 size={15} />,
          onClick: () => handleReturnToBackpack(target),
        },
      ];
    }

    const actions: ContextMenuItem[] = [];

    if (isMystery) {
      actions.push({
        label: t("contextMenu.openMysteryBox"),
        icon: <PackageOpen size={15} />,
        onClick: () => handleOpenMysteryBox(target),
      });
    } else if (isCoupon) {
      actions.push(
        {
          label: t("contextMenu.sendToFocus"),
          icon: <Flame size={15} />,
          onClick: () => handleSendToFocus(target),
        },
        {
          label: t("contextMenu.useImmediately"),
          icon: <Zap size={15} />,
          onClick: () => handleUseItem(target),
        },
      );
    } else {
      actions.push({
        label: t("contextMenu.useItem"),
        icon: <Zap size={15} />,
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
    isReturningToBackpack,
    openingBoxItem,
    handleOpenMysteryBox,
    handleCloseMysteryBox,
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
