"use client";

import { type RefObject, useEffect, useRef } from "react";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";

interface UseClickOutsideOptions {
  enabled?: boolean;
  onEscape?: () => void;
  extraRefs?: (RefObject<HTMLElement | null> | HTMLElement | null)[];
}

interface EscapeStackEntry {
  ref: RefObject<HTMLElement | null>;
  callbackRef: RefObject<(() => void) | undefined>;
}

const escapeStack: EscapeStackEntry[] = [];

function handleGlobalEscapeKeyDown(event: KeyboardEvent) {
  if (event.key !== "Escape" || event.defaultPrevented) return;
  const topEntry = escapeStack[escapeStack.length - 1];
  if (!topEntry?.callbackRef.current) return;

  // Se houver um <dialog open> na Top Layer acima deste overlay (isto é, o overlay não está
  // dentro do dialog mais recente), deixa o <dialog> nativo tratar o Escape primeiro.
  const openDialogs = document.querySelectorAll<HTMLElement>("dialog[open]");
  const topDialog =
    openDialogs.length > 0 ? openDialogs[openDialogs.length - 1] : null;
  if (
    topDialog &&
    topEntry.ref.current &&
    !topDialog.contains(topEntry.ref.current)
  ) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  topEntry.callbackRef.current();
}

export function registerEscapeEntry(entry: EscapeStackEntry): () => void {
  if (escapeStack.length === 0) {
    window.addEventListener("keydown", handleGlobalEscapeKeyDown);
  }
  escapeStack.push(entry);

  return () => {
    const idx = escapeStack.lastIndexOf(entry);
    if (idx >= 0) {
      escapeStack.splice(idx, 1);
    }
    if (escapeStack.length === 0) {
      window.removeEventListener("keydown", handleGlobalEscapeKeyDown);
    }
  };
}

/**
 * Registra um overlay (drawer, menu, popover) na pilha LIFO global de tecla `Escape`,
 * garantindo que apenas a camada mais interna feche a cada pressionamento.
 */
export function useEscapeStack<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T | null>,
  onEscape?: () => void,
  enabled = true,
) {
  const onEscapeRef = useRef(onEscape);
  useIsomorphicLayoutEffect(() => {
    onEscapeRef.current = onEscape;
  }, [onEscape]);
  const hasEscape = Boolean(onEscape);

  useEffect(() => {
    if (!enabled || !hasEscape) return;
    return registerEscapeEntry({ ref, callbackRef: onEscapeRef });
  }, [ref, enabled, hasEscape]);
}

/**
 * Hook reutilizável para detectar cliques fora de um elemento de referência e tecla Escape.
 * Utiliza pointerdown (captura) para comportamento consistente em desktop/mobile e pilha LIFO
 * de Escape para que apenas o popover/menu mais interno feche a cada tecla `Escape` (evitando
 * fechar modais `<dialog>` ou popovers pais simultaneamente).
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T | null>,
  onClickOutside: () => void,
  options: UseClickOutsideOptions = {},
) {
  const { enabled = true, onEscape, extraRefs } = options;
  const onClickOutsideRef = useRef(onClickOutside);
  const onEscapeRef = useRef(onEscape);
  const extraRefsRef = useRef(extraRefs);

  useIsomorphicLayoutEffect(() => {
    onClickOutsideRef.current = onClickOutside;
    onEscapeRef.current = onEscape;
    extraRefsRef.current = extraRefs;
  }, [onClickOutside, onEscape, extraRefs]);

  const hasEscape = Boolean(onEscape);

  useEffect(() => {
    if (!enabled) return;

    const handlePointerDown = (event: PointerEvent | MouseEvent) => {
      const target = event.target as Node | null;
      if (!target || !ref.current) return;

      // Ignora se o clique ocorreu dentro do container principal
      if (ref.current.contains(target)) return;

      // Ignora cliques em modais sobrepostos (<dialog open> na Top Layer ou portais [aria-modal="true"] posteriores)
      const targetElement =
        target instanceof Element ? target : target.parentElement;
      const modalEl = targetElement?.closest(
        'dialog[open], [aria-modal="true"]',
      );
      if (
        modalEl &&
        !modalEl.contains(ref.current) &&
        (modalEl.tagName === "DIALOG" ||
          Boolean(
            ref.current.compareDocumentPosition(modalEl) &
              Node.DOCUMENT_POSITION_FOLLOWING,
          ))
      ) {
        return;
      }

      const currentExtraRefs = extraRefsRef.current;

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
            currentExtraRefs?.some((extra) => {
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
        currentExtraRefs?.some((extra) => {
          if (!extra) return false;
          const el = "current" in extra ? extra.current : extra;
          return el?.contains(target);
        })
      ) {
        return;
      }

      onClickOutsideRef.current();
    };

    window.addEventListener("pointerdown", handlePointerDown, true);
    const unregisterEscape = hasEscape
      ? registerEscapeEntry({ ref, callbackRef: onEscapeRef })
      : null;

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown, true);
      unregisterEscape?.();
    };
  }, [ref, enabled, hasEscape]);
}
