"use client";

import { type RefObject, useEffect } from "react";

interface UseClickOutsideOptions {
  enabled?: boolean;
  onEscape?: () => void;
  extraRefs?: (RefObject<HTMLElement | null> | HTMLElement | null)[];
}

/**
 * Hook reutilizável para detectar cliques fora de um elemento de referência e tecla Escape.
 * Utiliza mousedown e pointerdown para garantir comportamento consistente em desktop e mobile.
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T | null>,
  onClickOutside: () => void,
  options: UseClickOutsideOptions = {},
) {
  const { enabled = true, onEscape, extraRefs } = options;

  useEffect(() => {
    if (!enabled) return;

    const handlePointerDown = (event: PointerEvent | MouseEvent) => {
      const target = event.target as Node | null;
      if (!target || !ref.current) return;

      // Ignora se o clique ocorreu dentro do container principal
      if (ref.current.contains(target)) return;

      // Ignora se o clique ocorreu dentro de um dropdown/popover em Portal (suporta múltiplos níveis aninhados)
      if (target instanceof Element) {
        let currentEl: Element | null = target;
        while (currentEl) {
          const portalPopup: Element | null =
            currentEl.closest("[data-select-for]");
          if (!portalPopup) break;
          const triggerId: string | null =
            portalPopup.getAttribute("data-select-for");
          const triggerEl: HTMLElement | null = triggerId
            ? document.getElementById(triggerId)
            : null;
          if (!triggerEl) break;
          if (
            ref.current.contains(triggerEl) ||
            extraRefs?.some((extra) => {
              if (!extra) return false;
              const el = "current" in extra ? extra.current : extra;
              return el?.contains(triggerEl);
            })
          ) {
            return;
          }
          currentEl = triggerEl;
        }
      }

      // Ignora se o clique ocorreu dentro de algum dos refs extras (ex: dropdown em Portal)
      if (
        extraRefs?.some((extra) => {
          if (!extra) return false;
          const el = "current" in extra ? extra.current : extra;
          return el?.contains(target);
        })
      ) {
        return;
      }

      onClickOutside();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && onEscape) {
        onEscape();
      }
    };

    window.addEventListener("pointerdown", handlePointerDown, true);
    if (onEscape) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown, true);
      if (onEscape) {
        window.removeEventListener("keydown", handleKeyDown);
      }
    };
  }, [ref, onClickOutside, enabled, onEscape, extraRefs]);
}
