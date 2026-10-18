import { serverApi } from "@/api/server";
import type { PageTransactionHistoryResponseDTO } from "@/types/history";

export interface GetHistoryParams {
  tab?: string;
  period?: string;
  search?: string;
  page?: number;
  size?: number;
}

/**
 * Consulta o histórico paginado de transações do usuário diretamente no servidor,
 * aplicando filtros de aba, período e busca textual.
 */
export async function getHistoryData(
  params?: GetHistoryParams,
): Promise<PageTransactionHistoryResponseDTO> {
  const currentTab =
    params?.tab && params.tab !== "ALL" ? params.tab : undefined;
  const currentPeriod =
    params?.period && params.period !== "ALL" ? params.period : undefined;
  const currentSearch = params?.search?.trim()
    ? params.search.trim()
    : undefined;
  const pageIndex = Math.max(0, (params?.page ?? 1) - 1);
  const pageSize = params?.size ?? 8;

  const { data, error } = await serverApi.GET("/transactions", {
    params: {
      query: {
        tab: currentTab,
        page: pageIndex,
        size: pageSize,
        ...(currentPeriod ? { period: currentPeriod } : {}),
        ...(currentSearch ? { search: currentSearch } : {}),
      } as Record<string, unknown>,
    },
    next: { tags: ["transactions"] },
  });

  if (error || !data) {
    return {
      content: [],
      totalElements: 0,
      totalPages: 1,
      size: pageSize,
      number: pageIndex,
    };
  }

  return data as PageTransactionHistoryResponseDTO;
}
