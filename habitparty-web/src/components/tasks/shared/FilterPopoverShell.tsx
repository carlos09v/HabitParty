"use client";

import { FilterX, SlidersHorizontal } from "lucide-react";
import {
  type CSSProperties,
  type ReactNode,
  type RefObject,
  useEffect,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/utils";

interface FilterPopoverShellProps {
  id?: string;
  popoverRef: RefObject<HTMLDivElement | null>;
  portalContainer: HTMLElement;
  floatingStyle?: CSSProperties;
  placement: "top" | "bottom";
  title: string;
  clearLabel: string;
  activeFiltersCount: number;
  onReset: () => void;
  className?: string;
  children: ReactNode;
}

/**
 * Invólucro compartilhado de Popover de Filtros (Dashboard e /tasks) com portal,
 * cabeçalho padronizado, botão de limpar condicional e foco acessível na abertura.
 */
export function FilterPopoverShell({
  id,
  popoverRef,
  portalContainer,
  floatingStyle,
  placement,
  title,
  clearLabel,
  activeFiltersCount,
  onReset,
  className,
  children,
}: FilterPopoverShellProps) {
  useEffect(() => {
    const node = popoverRef.current;
    if (!node) return;
    if (!node.contains(document.activeElement)) {
      node.focus({ preventScroll: true });
    }
  }, [popoverRef]);

  return createPortal(
    <div
      ref={popoverRef}
      id={id}
      role="dialog"
      aria-modal="false"
      aria-label={title}
      tabIndex={-1}
      style={floatingStyle}
      className={cn(
        "rounded-xl bg-popover border border-neutral-700 dark:border-primary/40 p-4 shadow-xl animate-in fade-in zoom-in-95 duration-150 overflow-hidden flex flex-col gap-3 focus:outline-none",
        placement === "top" ? "origin-bottom" : "origin-top",
        className,
      )}
    >
      <div className="flex items-center justify-between pb-2 border-b border-neutral-700 dark:border-white/10 shrink-0">
        <span className="text-xs font-bold text-neutral-100 flex items-center gap-1.5">
          <SlidersHorizontal
            size={13}
            className="text-amber-700 dark:text-gold"
            aria-hidden="true"
          />
          {title}
        </span>
        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 text-tiny text-neutral-400 hover:text-danger-500 dark:hover:text-danger-300 font-semibold transition-colors cursor-pointer rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger-500/60"
          >
            <FilterX size={12} aria-hidden="true" />
            <span>{clearLabel}</span>
          </button>
        )}
      </div>

      {children}
    </div>,
    portalContainer,
  );
}
