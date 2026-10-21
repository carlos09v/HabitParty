"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCompactMode } from "@/hooks/useCompactMode";
import type { TaskPaginationProps } from "@/types/dashboard";
import { cn } from "@/utils";
import { getPageNumbers } from "@/utils/dashboardMetrics";

export function TaskPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  itemLabel = "tarefas",
  isCompact: propIsCompact,
  onPageChange,
}: TaskPaginationProps) {
  const { isCompact: hookIsCompact } = useCompactMode();
  const isCompact = propIsCompact ?? hookIsCompact;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    onPageChange?.(newPage);
    const params = new URLSearchParams(searchParams.toString());
    if (newPage === 1) {
      params.delete("page");
    } else {
      params.set("page", newPage.toString());
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  if (totalPages <= 1) return null;

  const pageNumbers = getPageNumbers(currentPage, totalPages);

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
        <button
          type="button"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Página anterior"
          className={cn(
            "rounded-lg border border-white/20 bg-surface text-neutral-300 hover:bg-surface-hover hover:text-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-gold",
            isCompact ? "p-1" : "p-1.5",
          )}
        >
          <ChevronLeft size={isCompact ? 14 : 16} aria-hidden="true" />
        </button>

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
          return (
            <button
              key={page}
              type="button"
              onClick={() => handlePageChange(page)}
              aria-current={isActive ? "page" : undefined}
              aria-label={`Página ${page}`}
              className={cn(
                "px-2 rounded-lg font-bold transition-all focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-1 focus:ring-offset-background",
                isCompact ? "min-w-7 h-7 text-label-g" : "min-w-8 h-8 text-xs",
                isActive
                  ? "bg-gold text-neutral-900 shadow-sm"
                  : "border border-white/20 bg-surface text-neutral-300 hover:bg-surface-hover hover:text-neutral-100",
              )}
            >
              {page}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Próxima página"
          className={cn(
            "rounded-lg border border-white/20 bg-surface text-neutral-300 hover:bg-surface-hover hover:text-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-gold",
            isCompact ? "p-1" : "p-1.5",
          )}
        >
          <ChevronRight size={isCompact ? 14 : 16} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
