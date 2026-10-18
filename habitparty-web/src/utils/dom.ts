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
