import { cacheLife, cacheTag } from "next/cache";
import { getServerAuthToken, serverApi } from "@/api/server";
import { DEFAULT_HISTORY_PAGE_SIZE } from "@/constants/history";
import type { PageTransactionHistoryResponseDTO } from "@/types/history";
import {
  normalizeHistoryQuery,
  serializeHistorySearchParams,
} from "@/utils/historyUtils";

export interface GetHistoryParams {
  tab?: string;
  period?: string;
  from?: string;
  to?: string;
  search?: string;
  direction?: string;
  sort?: string;
  page?: number;
  size?: number;
}

export interface HistoryDataResult {
  data: PageTransactionHistoryResponseDTO;
  error: boolean;
}

/**
 * Consulta cacheada no escopo privado (`private30`).
 * Lança exceção em caso de erro de rede/HTTP para impedir que falhas transitórias sejam cacheadas.
 */
async function fetchHistoryDataCached(
  params?: GetHistoryParams,
): Promise<PageTransactionHistoryResponseDTO> {
  "use cache: private";
  cacheLife("private30");
  cacheTag("transactions");

  const normalized = normalizeHistoryQuery({
    tab: params?.tab,
    period: params?.period,
    from: params?.from,
    to: params?.to,
    search: params?.search,
    direction: params?.direction,
    sort: params?.sort,
    page: params?.page !== undefined ? String(params.page) : undefined,
    size: params?.size !== undefined ? String(params.size) : undefined,
  });
  const backendParams = serializeHistorySearchParams(normalized, {
    forBackend: true,
  });

  const pageIndex = Math.max(0, normalized.page - 1);
  const pageSize = normalized.size;

  const tab = backendParams.get("tab") ?? undefined;
  const period = backendParams.get("period") ?? undefined;
  const from = backendParams.get("from") ?? undefined;
  const to = backendParams.get("to") ?? undefined;
  const search = backendParams.get("search") ?? undefined;
  const direction = backendParams.get("direction") ?? undefined;
  const sort = backendParams.get("sort") ?? undefined;

  const { data, error } = await serverApi.GET("/transactions", {
    params: {
      query: {
        page: pageIndex,
        size: pageSize,
        ...(tab ? { tab } : {}),
        ...(period ? { period } : {}),
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
        ...(search ? { search } : {}),
        ...(direction ? { direction } : {}),
        ...(sort ? { sort } : {}),
      },
    },
  });

  if (error || !data) {
    throw new Error("HISTORY_FETCH_FAILED");
  }

  return data as PageTransactionHistoryResponseDTO;
}

/**
 * Consulta o histórico paginado de transações do usuário diretamente no servidor,
 * retornando erro explícito sem poluir o cache privado em caso de falha.
 */
export async function getHistoryData(
  params?: GetHistoryParams,
): Promise<HistoryDataResult> {
  const pageIndex = Math.max(0, (params?.page ?? 1) - 1);
  const pageSize = params?.size ?? DEFAULT_HISTORY_PAGE_SIZE;

  const token = await getServerAuthToken();
  if (!token) {
    return {
      error: true,
      data: {
        content: [],
        totalElements: 0,
        totalPages: 1,
        size: pageSize,
        number: pageIndex,
      },
    };
  }

  try {
    const data = await fetchHistoryDataCached(params);
    return { data, error: false };
  } catch (err) {
    console.error("[historyService:getHistoryData]", err);
    return {
      error: true,
      data: {
        content: [],
        totalElements: 0,
        totalPages: 1,
        size: pageSize,
        number: pageIndex,
      },
    };
  }
}
