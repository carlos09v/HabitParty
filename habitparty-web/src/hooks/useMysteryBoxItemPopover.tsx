"use client";

import {
  type CSSProperties,
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { MysteryBoxTierPopover } from "@/components/reward/MysteryBoxTierPopover";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useFloatingPopover } from "@/hooks/useFloatingPopover";
import type { MysteryBoxLootItem, MysteryBoxTier } from "@/types/reward";

const HOVER_CLOSE_DELAY_MS = 150;

export interface MysteryPopoverBridge {
  popoverId: string;
  tierContainerRef: RefObject<HTMLElement | null>;
  tierTriggerRef: RefObject<HTMLElement | null>;
  isOpen: boolean;
  isPinned: boolean;
  openFromHover: () => void;
  closeFromHover: () => void;
  openFromFocus: () => void;
  closeFromBlur: (relatedTarget: EventTarget | null) => void;
  togglePinned: () => void;
  portalNode: ReactNode;
}

interface UseMysteryBoxItemPopoverParams {
  mysteryTier: MysteryBoxTier;
  isDragging?: boolean;
  disabled?: boolean;
  align?: "left" | "right" | "center";
  estimatedHeight?: number;
  offset?: number;
  zIndex?: number;
  price?: number;
  showPriceFooter?: boolean;
  isGamified?: boolean;
  lootItems?: MysteryBoxLootItem[];
}

/**
 * Isola o gerenciamento do popover de probabilidades da Caixa Misteriosa
 * para uso compartilhado entre GamifiedItemCard, ItemRow e MysteryBoxSelector
 * sem alocar hooks em outros tipos de item.
 */
export function useMysteryBoxItemPopover({
  mysteryTier,
  isDragging = false,
  disabled = false,
  align = "right",
  estimatedHeight = 340,
  offset = 8,
  zIndex = 80,
  price,
  showPriceFooter = true,
  isGamified: isGamifiedOverride,
  lootItems,
}: UseMysteryBoxItemPopoverParams): MysteryPopoverBridge {
  const { isGamified: storeIsGamified } = useExperienceMode();
  const isGamified = isGamifiedOverride ?? storeIsGamified;
  const isBlocked = isDragging || disabled;
  const popoverId = useId();
  const [isPinnedByClick, setIsPinnedByClick] = useState(false);
  const isPinnedRef = useRef(false);
  const hoverLeaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHoverLeaveTimer = useCallback(() => {
    if (hoverLeaveTimerRef.current !== null) {
      clearTimeout(hoverLeaveTimerRef.current);
      hoverLeaveTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearHoverLeaveTimer(), [clearHoverLeaveTimer]);

  const handleFloatingClose = useCallback(() => {
    clearHoverLeaveTimer();
    isPinnedRef.current = false;
    setIsPinnedByClick(false);
  }, [clearHoverLeaveTimer]);

  const {
    containerRef: tierContainerRef,
    triggerRef: tierTriggerRef,
    popoverRef: tierPopoverRef,
    isOpen: isTierPopoverOpen,
    open: openFloating,
    close: closeFloating,
    coords: tierPopoverCoords,
    shouldRenderPortal: shouldRenderTierPortal,
    portalContainer,
    floatingStyle: tierFloatingStyle,
  } = useFloatingPopover<HTMLElement, HTMLElement, HTMLElement>({
    align,
    estimatedWidth: 288,
    estimatedHeight,
    margin: 12,
    offset,
    zIndex,
    disabled: isBlocked,
    restoreFocusOnEscape: true,
    onClose: handleFloatingClose,
  });

  useEffect(() => {
    if (isBlocked && isTierPopoverOpen) {
      closeFloating();
    }
  }, [isBlocked, isTierPopoverOpen, closeFloating]);

  const openFromHover = useCallback(() => {
    clearHoverLeaveTimer();
    if (!isPinnedRef.current && !isTierPopoverOpen) {
      openFloating();
    }
  }, [clearHoverLeaveTimer, isTierPopoverOpen, openFloating]);

  const closeFromHover = useCallback(() => {
    if (isPinnedRef.current) return;
    clearHoverLeaveTimer();
    hoverLeaveTimerRef.current = setTimeout(() => {
      hoverLeaveTimerRef.current = null;
      if (!isPinnedRef.current) {
        closeFloating();
      }
    }, HOVER_CLOSE_DELAY_MS);
  }, [clearHoverLeaveTimer, closeFloating]);

  const openFromFocus = useCallback(() => {
    clearHoverLeaveTimer();
    if (!isPinnedRef.current && !isTierPopoverOpen) {
      openFloating();
    }
  }, [clearHoverLeaveTimer, isTierPopoverOpen, openFloating]);

  const closeFromBlur = useCallback(
    (relatedTarget: EventTarget | null) => {
      if (isPinnedRef.current) return;
      const nextNode = relatedTarget instanceof Node ? relatedTarget : null;
      if (
        nextNode &&
        (tierContainerRef.current?.contains(nextNode) ||
          tierPopoverRef.current?.contains(nextNode))
      ) {
        return;
      }
      clearHoverLeaveTimer();
      closeFloating();
    },
    [clearHoverLeaveTimer, closeFloating, tierContainerRef, tierPopoverRef],
  );

  const togglePinned = useCallback(() => {
    clearHoverLeaveTimer();
    if (isPinnedRef.current && isTierPopoverOpen) {
      isPinnedRef.current = false;
      setIsPinnedByClick(false);
      closeFloating();
    } else {
      isPinnedRef.current = true;
      setIsPinnedByClick(true);
      if (!isTierPopoverOpen) {
        openFloating();
      }
    }
  }, [clearHoverLeaveTimer, isTierPopoverOpen, closeFloating, openFloating]);

  const portalNode =
    shouldRenderTierPortal &&
    portalContainer &&
    isTierPopoverOpen &&
    !isBlocked &&
    tierPopoverCoords
      ? createPortal(
          <MysteryBoxTierPopover
            id={popoverId}
            tier={mysteryTier}
            isGamified={isGamified}
            customPrice={price}
            showPriceFooter={showPriceFooter}
            customLootItems={lootItems}
            popoverRef={tierPopoverRef}
            style={tierFloatingStyle as CSSProperties}
            onMouseEnter={clearHoverLeaveTimer}
            onMouseLeave={closeFromHover}
          />,
          portalContainer,
        )
      : null;

  return useMemo(
    () => ({
      popoverId,
      tierContainerRef,
      tierTriggerRef,
      isOpen: isTierPopoverOpen,
      isPinned: isPinnedByClick,
      openFromHover,
      closeFromHover,
      openFromFocus,
      closeFromBlur,
      togglePinned,
      portalNode,
    }),
    [
      popoverId,
      tierContainerRef,
      tierTriggerRef,
      isTierPopoverOpen,
      isPinnedByClick,
      openFromHover,
      closeFromHover,
      openFromFocus,
      closeFromBlur,
      togglePinned,
      portalNode,
    ],
  );
}
