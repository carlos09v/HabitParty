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

export function useInventoryCatalogActions({
  items,
  setItems,
}: UseInventoryCatalogActionsParams) {
  const router = useRouter();
  const t = useTranslations("inventory.container");
  const { isGamified } = useExperienceMode();

  const [isUsing, setIsUsing] = useState(false);
  const [isSendingToFocus, setIsSendingToFocus] = useState(false);
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
      try {
        const res = await consumeInventoryItem(item.id);
        if (!res.success) {
          toast.error(res.error || t("toasts.useError"));
          return;
        }
        setItems((prev) =>
          prev
            .map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i,
            )
            .filter((i) => i.quantity > 0),
        );
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
      try {
        const res = await sendItemToFocus(item.id);
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
          // Se havia mais de 1 unidade agrupada, reduz 1 da disponível e sincroniza com o servidor
          return prev.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i,
          );
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
      try {
        const res = await returnItemToBackpack(item.id);
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
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, status: "AVAILABLE" } : i,
          ),
        );
      } catch (_error) {
        toast.error(t("toasts.serverError"));
      }
    },
    [isGamified, setItems, t],
  );

  const handleConfirmDiscard = useCallback(() => {
    if (!itemToDiscard) return;
    const target = itemToDiscard;
    const previousItems = [...items];

    setItems((prev) =>
      prev
        .map((i) =>
          i.id === target.id ? { ...i, quantity: i.quantity - 1 } : i,
        )
        .filter((i) => i.quantity > 0),
    );
    setItemToDiscard(null);

    startDiscardTransition(async () => {
      const res = await discardInventoryItem(target.id);
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
