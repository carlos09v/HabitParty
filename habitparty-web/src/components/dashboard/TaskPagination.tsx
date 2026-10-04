"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/utils";

interface TaskPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export function TaskPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
}: TaskPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  if (totalPages <= 1) return null;

  return (
    <nav className="flex items-center justify-between gap-4 py-3 px-2 border-t border-white/10 text-sm" aria-label="Paginação de tarefas">
      {/* Contagem de itens */}
      <span className="text-xs text-neutral-400" aria-live="polite">
        Mostrando{" "}
        <strong className="text-neutral-100">
          {startItem}-{endItem}
        </strong>{" "}
        de <strong className="text-neutral-100">{totalItems}</strong> tarefas
      </span>

      {/* Controles da paginação */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Página anterior"
          className="p-1.5 rounded-lg border border-white/20 bg-surface text-neutral-300 hover:bg-surface-hover hover:text-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-gold"
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>

        {Array.from({ length: totalPages }).map((_, i) => {
          const page = i + 1;
          const isActive = page === currentPage;
          return (
            <button
              key={page}
              type="button"
              onClick={() => handlePageChange(page)}
              aria-current={isActive ? "page" : undefined}
              aria-label={`Página ${page}`}
              className={cn(
                "min-w-8 h-8 px-2 rounded-lg text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-1 focus:ring-offset-background",
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
          className="p-1.5 rounded-lg border border-white/20 bg-surface text-neutral-300 hover:bg-surface-hover hover:text-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-gold"
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
