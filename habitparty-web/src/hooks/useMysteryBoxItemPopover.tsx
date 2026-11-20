"use client";

import type { CSSProperties, ReactNode, RefObject } from "react";
import { createPortal } from "react-dom";
import { MysteryBoxTierPopover } from "@/components/reward/MysteryBoxTierPopover";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useFloatingPopover } from "@/hooks/useFloatingPopover";
import type { MysteryBoxLootItem, MysteryBoxTier } from "@/types/reward";

export interface MysteryPopoverBridge {
  tierContainerRef: RefObject<HTMLElement | null>;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  portalNode: ReactNode;
}

interface UseMysteryBoxItemPopoverParams {
  mysteryTier: MysteryBoxTier;
  isDragging: boolean;
  price?: number;
  lootItems?: MysteryBoxLootItem[];
}

/**
 * Isola o gerenciamento do popover de probabilidades da Caixa Misteriosa
 * para uso compartilhado entre GamifiedItemCard e ItemRow sem alocar hooks em outros tipos de item.
 */
export function useMysteryBoxItemPopover({
  mysteryTier,
  isDragging,
  price,
  lootItems,
}: UseMysteryBoxItemPopoverParams): MysteryPopoverBridge {
  const { isGamified } = useExperienceMode();
  const {
    containerRef: tierContainerRef,
    popoverRef: tierPopoverRef,
    isOpen: isTierPopoverOpen,
    open: openTierPopover,
    close: closeTierPopover,
    toggle: toggleTierPopover,
    coords: tierPopoverCoords,
    shouldRenderPortal: shouldRenderTierPortal,
    floatingStyle: tierFloatingStyle,
  } = useFloatingPopover<HTMLElement, HTMLElement, HTMLElement>({
    align: "right",
    estimatedWidth: 288,
    estimatedHeight: 340,
    margin: 12,
    offset: 8,
    zIndex: 80,
    disabled: isDragging,
  });

  const portalNode =
    shouldRenderTierPortal &&
    isTierPopoverOpen &&
    !isDragging &&
    tierPopoverCoords
      ? createPortal(
          <MysteryBoxTierPopover
            tier={mysteryTier}
            isGamified={isGamified}
            customPrice={price}
            customLootItems={lootItems}
            popoverRef={tierPopoverRef}
            style={tierFloatingStyle as CSSProperties}
          />,
          document.body,
        )
      : null;

  return {
    tierContainerRef,
    isOpen: isTierPopoverOpen,
    open: openTierPopover,
    close: closeTierPopover,
    toggle: toggleTierPopover,
    portalNode,
  };
}
