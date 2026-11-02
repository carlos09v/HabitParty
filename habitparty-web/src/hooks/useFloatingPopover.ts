"use client";

import {
  type CSSProperties,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useClickOutside } from "@/hooks/useClickOutside";

export interface FloatingPopoverCoords {
  top?: number;
  bottom?: number;
  left: number;
  width?: number;
  maxHeight?: number;
  placement: "bottom" | "top";
}

export interface UseFloatingPopoverOptions {
  align?: "left" | "right" | "center";
  estimatedHeight?: number;
  estimatedWidth?: number;
  matchTriggerWidth?: boolean;
  maxAllowedHeight?: number;
  minAllowedHeight?: number;
  offset?: number;
  margin?: number;
  disabled?: boolean;
  usePortal?: boolean;
  zIndex?: number;
  onOpen?: () => void;
}

/**
 * Hook universal para gerenciamento de popovers, dropdowns e seletores flutuantes (Select, DatePicker, TimePicker, IconPicker).
 * Centraliza cálculo de coordenadas, auto-flip vertical (top/bottom), clamp horizontal na tela,
 * proteção contra scroll interno, fechamento no clique fora / Escape e estilo para Portal.
 */
export function useFloatingPopover<
  TContainer extends HTMLElement = HTMLDivElement,
  TTrigger extends HTMLElement = HTMLButtonElement,
  TPopover extends HTMLElement = HTMLDivElement,
>(options: UseFloatingPopoverOptions = {}) {
  const {
    align = "left",
    estimatedHeight = 260,
    estimatedWidth = 160,
    matchTriggerWidth = false,
    maxAllowedHeight,
    minAllowedHeight = 96,
    offset = 6,
    margin = 8,
    disabled = false,
    usePortal = true,
    zIndex = 150,
    onOpen,
  } = options;

  const containerRef = useRef<TContainer>(null);
  const triggerRef = useRef<TTrigger>(null);
  const popoverRef = useRef<TPopover>(null);

  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<FloatingPopoverCoords | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setCoords(null);
  }, []);

  useClickOutside(containerRef, close, {
    enabled: isOpen,
    onEscape: close,
    extraRefs: [popoverRef],
  });

  const computeCoords = useCallback((): FloatingPopoverCoords | null => {
    const anchorEl = triggerRef.current || containerRef.current;
    if (!anchorEl || typeof window === "undefined") return null;

    const rect = anchorEl.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    if (rect.bottom < 0 || rect.top > viewportHeight) {
      return null;
    }

    const measuredHeight = popoverRef.current?.offsetHeight || estimatedHeight;
    const targetHeight = maxAllowedHeight
      ? Math.min(measuredHeight, maxAllowedHeight)
      : measuredHeight;

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    let placement: "bottom" | "top" = "bottom";
    if (spaceBelow < targetHeight + margin && spaceAbove > spaceBelow) {
      placement = "top";
    }

    const top =
      placement === "bottom" ? Math.round(rect.bottom + offset) : undefined;
    const bottom =
      placement === "top"
        ? Math.round(viewportHeight - rect.top + offset)
        : undefined;

    const maxHeight = maxAllowedHeight
      ? placement === "bottom"
        ? Math.max(
            minAllowedHeight,
            Math.min(
              maxAllowedHeight,
              Math.floor(spaceBelow - margin - offset),
            ),
          )
        : Math.max(
            minAllowedHeight,
            Math.min(
              maxAllowedHeight,
              Math.floor(spaceAbove - margin - offset),
            ),
          )
      : undefined;

    const width = matchTriggerWidth ? Math.round(rect.width) : undefined;
    const effectiveWidth =
      width ??
      Math.min(
        popoverRef.current?.offsetWidth || estimatedWidth,
        viewportWidth - margin * 2,
      );

    let left = rect.left;
    if (!matchTriggerWidth) {
      if (align === "right") {
        left = rect.right - effectiveWidth;
      } else if (align === "center") {
        left = rect.left + rect.width / 2 - effectiveWidth / 2;
      }
    } else if (align === "right") {
      const dropdownWidth = popoverRef.current?.offsetWidth || rect.width;
      left = rect.right - dropdownWidth;
    }

    if (left + effectiveWidth > viewportWidth - margin) {
      left = Math.max(margin, viewportWidth - effectiveWidth - margin);
    }
    if (left < margin) {
      left = margin;
    }

    return {
      top,
      bottom,
      left: Math.round(left),
      width,
      maxHeight,
      placement,
    };
  }, [
    align,
    estimatedHeight,
    estimatedWidth,
    margin,
    matchTriggerWidth,
    maxAllowedHeight,
    minAllowedHeight,
    offset,
  ]);

  const open = useCallback(() => {
    if (disabled) return;
    onOpen?.();
    const initialCoords = computeCoords();
    if (initialCoords) {
      setCoords(initialCoords);
    }
    setIsOpen(true);
  }, [disabled, onOpen, computeCoords]);

  const toggle = useCallback(() => {
    if (disabled) return;
    if (!isOpen) {
      open();
    } else {
      close();
    }
  }, [disabled, isOpen, open, close]);

  // Refina coordenadas após montagem do elemento do popover (caso largura/altura real difira da estimada)
  useLayoutEffect(() => {
    if (!isOpen || !usePortal) return;
    const refined = computeCoords();
    if (refined) {
      setCoords((prev) => {
        if (
          prev &&
          prev.top === refined.top &&
          prev.bottom === refined.bottom &&
          prev.left === refined.left &&
          prev.width === refined.width &&
          prev.maxHeight === refined.maxHeight &&
          prev.placement === refined.placement
        ) {
          return prev;
        }
        return refined;
      });
    }
  }, [isOpen, usePortal, computeCoords]);

  // Atualiza coordenadas em scroll externo ou resize da janela
  useEffect(() => {
    if (!isOpen || !usePortal) return;

    const handleScrollOrResize = (e: Event) => {
      if (
        popoverRef.current &&
        e.target instanceof Node &&
        popoverRef.current.contains(e.target)
      ) {
        return;
      }
      const nextCoords = computeCoords();
      if (!nextCoords) {
        close();
      } else {
        setCoords(nextCoords);
      }
    };

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen, usePortal, computeCoords, close]);

  const shouldRenderPortal = Boolean(usePortal && mounted);

  const floatingStyle: CSSProperties | undefined =
    shouldRenderPortal && coords
      ? {
          position: "fixed",
          top: coords.top !== undefined ? `${coords.top}px` : undefined,
          bottom:
            coords.bottom !== undefined ? `${coords.bottom}px` : undefined,
          left: `${coords.left}px`,
          width: coords.width ? `${coords.width}px` : undefined,
          maxHeight: coords.maxHeight ? `${coords.maxHeight}px` : undefined,
          zIndex,
          transformOrigin: coords.placement === "top" ? "bottom" : "top",
        }
      : undefined;

  return {
    containerRef,
    triggerRef,
    popoverRef,
    isOpen,
    setIsOpen,
    open,
    close,
    toggle,
    coords,
    shouldRenderPortal,
    floatingStyle,
  };
}
