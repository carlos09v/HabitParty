"use client";

import { type RefObject, useEffect } from "react";
import { scrollColumnIntoKanbanView } from "@/utils/dom";

/**
 * Rola suavemente a coluna selecionada (vinda de `?columnId=...`) para a viewport,
 * respeitando `prefers-reduced-motion` nos modos Kanban horizontal e Lista vertical.
 */
export function useScrollSelectedColumn(
  ref: RefObject<HTMLElement | null>,
  isSelected: boolean,
  mode: "kanban" | "list",
) {
  useEffect(() => {
    if (!isSelected || !ref.current) return;

    const delay = mode === "kanban" ? 80 : 60;
    const timer = setTimeout(() => {
      const node = ref.current;
      if (!node) return;

      if (mode === "kanban") {
        scrollColumnIntoKanbanView(node);
        return;
      }

      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      node.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "center",
        inline: "nearest",
      });
      if (typeof window !== "undefined" && window.scrollX !== 0) {
        window.scrollTo({ left: 0 });
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [ref, isSelected, mode]);
}
