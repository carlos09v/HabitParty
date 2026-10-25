"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Pagination } from "@/components/ui/Pagination";
import { useCompactMode } from "@/hooks/useCompactMode";
import type { TaskPaginationProps } from "@/types/dashboard";

/**
 * Wrapper leve de paginação sincronizada com SearchParams no cliente.
 * Delega toda a marcação e estilização para o primitivo unificado `<Pagination />`.
 */
export function TaskPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  itemLabel = "tarefas",
  isCompact: propIsCompact,
  onPageChange,
}: TaskPaginationProps) {
  const { isCompact } = useCompactMode(propIsCompact);
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
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      totalItems={totalItems}
      itemsPerPage={itemsPerPage}
      itemLabel={itemLabel}
      isCompact={isCompact}
      onPageChange={handlePageChange}
    />
  );
}
