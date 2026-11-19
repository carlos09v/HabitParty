import type React from "react";

/**
 * Handlers de ponteiro para impedir que botões internos iniciem arraste (@dnd-kit) em cards/linhas ordenáveis.
 */
export const STOP_DRAG_PROPAGATION_PROPS = {
  onPointerDown: (e: React.PointerEvent) => e.stopPropagation(),
  onMouseDown: (e: React.MouseEvent) => e.stopPropagation(),
  onTouchStart: (e: React.TouchEvent) => e.stopPropagation(),
} as const;

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
 * Remove um parâmetro específico da URL atual do navegador usando `history.replaceState`
 * sem acionar recarregamento de rota no Next.js.
 */
export function removeBrowserQueryParam(paramName: string): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (!url.searchParams.has(paramName)) return;
  url.searchParams.delete(paramName);
  const nextSearch = url.searchParams.toString();
  const nextUrl = `${url.pathname}${nextSearch ? `?${nextSearch}` : ""}${url.hash}`;
  window.history.replaceState(null, "", nextUrl);
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
