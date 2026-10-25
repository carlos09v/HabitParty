import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/utils";
import { getPageNumbers } from "@/utils/dashboardMetrics";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  itemLabel?: string;
  isCompact?: boolean;
  /** Função geradora de URL para cada página (Server Components com <Link>). */
  buildHref?: (page: number) => string;
  /** Callback de troca de página no cliente (quando usado sem navegação <Link>). */
  onPageChange?: (page: number) => void;
}

/**
 * Componente unificado de Paginação acessível.
 * Suporta tanto Server Components via `<Link href={buildHref(page)}>` quanto
 * Client Components interativos via `onPageChange(page)`.
 */
export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  itemLabel = "itens",
  isCompact = false,
  buildHref,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  const prevDisabled = currentPage <= 1;
  const nextDisabled = currentPage >= totalPages;

  const navBtnClass = cn(
    "rounded-lg border border-white/20 bg-surface text-neutral-300 hover:bg-surface-hover hover:text-neutral-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gold flex items-center justify-center cursor-pointer",
    isCompact ? "p-1" : "p-1.5",
  );

  const disabledNavBtnClass = cn(
    "rounded-lg border border-white/10 bg-surface/50 text-neutral-500 opacity-40 cursor-not-allowed flex items-center justify-center",
    isCompact ? "p-1" : "p-1.5",
  );

  return (
    <nav
      className={cn(
        "flex items-center justify-between gap-4 border-t border-white/10 text-sm",
        isCompact ? "py-1.5 px-2" : "py-3 px-2",
      )}
      aria-label={`Paginação de ${itemLabel}`}
    >
      {/* Contagem de itens */}
      <span className="text-xs text-neutral-400" aria-live="polite">
        Mostrando{" "}
        <strong className="text-neutral-100">
          {startItem}-{endItem}
        </strong>{" "}
        de <strong className="text-neutral-100">{totalItems}</strong>{" "}
        {itemLabel}
      </span>

      {/* Controles da paginação */}
      <div className="flex items-center gap-1.5">
        {prevDisabled ? (
          <button
            type="button"
            disabled
            aria-disabled="true"
            aria-label="Página anterior"
            className={disabledNavBtnClass}
          >
            <ChevronLeft size={isCompact ? 14 : 16} aria-hidden="true" />
          </button>
        ) : buildHref ? (
          <Link
            href={buildHref(currentPage - 1)}
            scroll={false}
            aria-label="Página anterior"
            className={navBtnClass}
          >
            <ChevronLeft size={isCompact ? 14 : 16} aria-hidden="true" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => onPageChange?.(currentPage - 1)}
            aria-label="Página anterior"
            className={navBtnClass}
          >
            <ChevronLeft size={isCompact ? 14 : 16} aria-hidden="true" />
          </button>
        )}

        {pageNumbers.map((item, idx) => {
          if (item === "dots") {
            return (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: Indicador estático de reticências
                key={`dots-${idx}`}
                className="px-1 text-neutral-500 font-bold select-none text-xs"
                aria-hidden="true"
              >
                ...
              </span>
            );
          }

          const page = item;
          const isActive = page === currentPage;
          const pageItemClass = cn(
            "px-2 rounded-lg font-bold transition-all focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-1 focus:ring-offset-background flex items-center justify-center cursor-pointer",
            isCompact ? "min-w-7 h-7 text-label-g" : "min-w-8 h-8 text-xs",
            isActive
              ? "bg-gold text-neutral-900 shadow-sm"
              : "border border-white/20 bg-surface text-neutral-300 hover:bg-surface-hover hover:text-neutral-100",
          );

          if (buildHref) {
            return (
              <Link
                key={page}
                href={buildHref(page)}
                scroll={false}
                aria-current={isActive ? "page" : undefined}
                aria-label={`Página ${page}`}
                className={pageItemClass}
              >
                {page}
              </Link>
            );
          }

          return (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange?.(page)}
              aria-current={isActive ? "page" : undefined}
              aria-label={`Página ${page}`}
              className={pageItemClass}
            >
              {page}
            </button>
          );
        })}

        {nextDisabled ? (
          <button
            type="button"
            disabled
            aria-disabled="true"
            aria-label="Próxima página"
            className={disabledNavBtnClass}
          >
            <ChevronRight size={isCompact ? 14 : 16} aria-hidden="true" />
          </button>
        ) : buildHref ? (
          <Link
            href={buildHref(currentPage + 1)}
            scroll={false}
            aria-label="Próxima página"
            className={navBtnClass}
          >
            <ChevronRight size={isCompact ? 14 : 16} aria-hidden="true" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => onPageChange?.(currentPage + 1)}
            aria-label="Próxima página"
            className={navBtnClass}
          >
            <ChevronRight size={isCompact ? 14 : 16} aria-hidden="true" />
          </button>
        )}
      </div>
    </nav>
  );
}
