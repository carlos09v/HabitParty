import type React from "react";

/**
 * Cria um DOMRect seguro ancorado nas coordenadas horizontais do clique
 * e no alinhamento vertical do elemento clicado para uso em popovers flutuantes.
 */
export function getClickAnchorRect(e: React.MouseEvent<HTMLElement>): DOMRect {
  const rect = e.currentTarget.getBoundingClientRect();
  if (typeof DOMRect !== "undefined") {
    return new DOMRect(e.clientX, rect.top, 0, rect.height);
  }
  return {
    top: rect.top,
    bottom: rect.bottom,
    left: e.clientX,
    right: e.clientX,
    width: 0,
    height: rect.height,
    x: e.clientX,
    y: rect.top,
    toJSON: () => {},
  } as DOMRect;
}

/**
 * Rola exclusivamente o container horizontal (`.overflow-x-auto`) de uma coluna do Kanban
 * para centralizá-la, garantindo que containers ancestrais (`main`, `window`) não sofram scroll lateral.
 */
export function scrollColumnIntoKanbanView(column: HTMLElement): void {
  const scrollContainer = column.closest<HTMLElement>(".overflow-x-auto");
  if (scrollContainer) {
    const containerRect = scrollContainer.getBoundingClientRect();
    const columnRect = column.getBoundingClientRect();

    const currentScroll = scrollContainer.scrollLeft;
    const relativeLeft = columnRect.left - containerRect.left + currentScroll;
    const targetScroll =
      relativeLeft - scrollContainer.clientWidth / 2 + column.clientWidth / 2;

    scrollContainer.scrollTo({
      left: Math.max(0, targetScroll),
      behavior: "smooth",
    });
  }

  if (typeof window !== "undefined" && window.scrollX !== 0) {
    window.scrollTo({ left: 0 });
  }
  const mainEl = column.closest("main");
  if (mainEl && mainEl.scrollLeft !== 0) {
    mainEl.scrollLeft = 0;
  }
  const layoutContainer = mainEl?.parentElement;
  if (layoutContainer && layoutContainer.scrollLeft !== 0) {
    layoutContainer.scrollLeft = 0;
  }
}
