"use client";

import { type RefObject, useEffect } from "react";
import { hasOpenModalDialog, isInsideAnyDialog } from "@/utils/portal";

interface UseFocusKeyboardShortcutsOptions {
  /** Ativa ou pausa o listener (ex.: desativado no palco enquanto Modo Zen está aberto). */
  enabled?: boolean;
  /** Quando usado dentro de um `<dialog>` próprio (Modo Zen), permite operar enquanto for o diálogo no topo. */
  ownDialogRef?: RefObject<HTMLDialogElement | null>;
  onToggleTimer: () => void;
  onToggleZenMode: () => void;
}

const INTERACTIVE_SPACE_SELECTOR =
  "a, button, [role='button'], [role='menuitem'], [role='tab'], [role='radio'], [role='switch']";

/**
 * Atalhos de teclado unificados do timer de foco (`Space` = Play/Pause, `Z` = Modo Zen),
 * compartilhados entre o Palco principal (`FocusHeroStage`) e o Modo Zen (`FocusZenModeModal`).
 */
export function useFocusKeyboardShortcuts({
  enabled = true,
  ownDialogRef,
  onToggleTimer,
  onToggleZenMode,
}: UseFocusKeyboardShortcutsOptions) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      if (ownDialogRef) {
        const openDialogs = document.querySelectorAll("dialog[open]");
        const hasDialogAbove =
          openDialogs.length > 0 &&
          openDialogs[openDialogs.length - 1] !== ownDialogRef.current;
        if (hasDialogAbove) {
          return;
        }
      } else if (hasOpenModalDialog()) {
        return;
      }

      const activeEl = document.activeElement as HTMLElement | null;
      if (activeEl) {
        const isEditableField =
          activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.tagName === "SELECT" ||
          activeEl.isContentEditable ||
          Boolean(activeEl.closest('[role="dialog"][aria-modal="false"]'));

        if (isEditableField) {
          return;
        }

        if (!ownDialogRef && isInsideAnyDialog(activeEl)) {
          return;
        }
      }

      if (e.code === "Space") {
        if (activeEl?.closest(INTERACTIVE_SPACE_SELECTOR)) {
          return;
        }
        e.preventDefault();
        onToggleTimer();
      } else if (e.key === "z" || e.key === "Z") {
        if (activeEl?.closest(INTERACTIVE_SPACE_SELECTOR) && !ownDialogRef) {
          return;
        }
        e.preventDefault();
        onToggleZenMode();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, ownDialogRef, onToggleTimer, onToggleZenMode]);
}
