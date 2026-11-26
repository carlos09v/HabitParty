"use client";

let activeBodyScrollLocks = 0;
let savedBodyOverflow: string | null = null;

/**
 * Trava o scroll do `document.body` com contagem de referência para evitar que
 * modais/drawers empilhados sobrescrevam `overflow` com `"hidden"` ao desmontar.
 */
export function lockBodyScroll(): () => void {
  if (typeof document === "undefined") {
    return () => {};
  }

  if (activeBodyScrollLocks === 0) {
    savedBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  activeBodyScrollLocks += 1;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    activeBodyScrollLocks = Math.max(0, activeBodyScrollLocks - 1);
    if (activeBodyScrollLocks === 0) {
      document.body.style.overflow = savedBodyOverflow ?? "";
      savedBodyOverflow = null;
    }
  };
}
