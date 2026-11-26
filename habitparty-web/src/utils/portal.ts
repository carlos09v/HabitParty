"use client";

let toastLayerEl: HTMLElement | null = null;

/**
 * Resolve o container de Portal ideal para elementos flutuantes (Select, DatePicker, Popovers, Tooltips).
 * Quando o elemento âncora está dentro de um `<dialog open>` nativo (Top Layer), o portal deve ser
 * montado dentro do próprio `<dialog>` para não ficar oculto atrás do backdrop nem marcado como `inert`.
 */
export function resolvePortalContainer(
  anchor?: Element | null,
): HTMLElement | null {
  if (typeof document === "undefined") return null;
  const openDialog = anchor?.closest("dialog[open]") as HTMLElement | null;
  return openDialog ?? document.body;
}

/**
 * Resolve o container de Portal para overlays sem âncora fixa (ex: `ContextMenu`),
 * montando dentro do `<dialog open>` mais recente quando houver um modal nativo aberto.
 */
export function resolveTopmostPortalContainer(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  const openDialogs = document.querySelectorAll<HTMLElement>("dialog[open]");
  return openDialogs.length > 0
    ? openDialogs[openDialogs.length - 1]
    : document.body;
}

/**
 * Verifica se existe um modal nativo (`<dialog open>`) ou dialog ARIA modal aberto na tela.
 */
export function hasOpenModalDialog(): boolean {
  if (typeof document === "undefined") return false;
  return Boolean(
    document.querySelector('dialog[open], [role="dialog"][aria-modal="true"]'),
  );
}

/**
 * Verifica se existe especificamente um `<dialog open>` nativo aberto na Top Layer.
 */
export function hasOpenNativeDialog(): boolean {
  if (typeof document === "undefined") return false;
  return Boolean(document.querySelector("dialog[open]"));
}

/**
 * Verifica se o elemento alvo está dentro de qualquer dialog (nativo `<dialog open>` ou `[role="dialog"]`).
 */
export function isInsideAnyDialog(target: Element | null | undefined): boolean {
  if (!target) return false;
  return Boolean(target.closest('dialog[open], [role="dialog"]'));
}

/**
 * Registra o container `popover="manual"` do `AppToaster` para promovê-lo acima de `<dialog>.showModal()`.
 */
export function registerToastLayer(el: HTMLElement | null): void {
  toastLayerEl = el;
  if (el) {
    promoteToastLayer();
  }
}

/**
 * Re-promove o container do `AppToaster` na Top Layer logo após um `<dialog>.showModal()` abrir,
 * garantindo que toasts de validação/feedback continuem visíveis acima do backdrop do modal.
 */
export function promoteToastLayer(): void {
  const el = toastLayerEl;
  if (!el || !el.isConnected) return;
  if (typeof el.showPopover !== "function") return;
  try {
    if (el.matches(":popover-open")) {
      el.hidePopover();
    }
    el.showPopover();
  } catch {
    // Fallback silencioso caso o navegador não suporte Popover API ou o elemento esteja oculto
  }
}
