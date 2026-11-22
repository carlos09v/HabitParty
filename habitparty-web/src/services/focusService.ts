import { cacheLife, cacheTag } from "next/cache";
import { serverApi } from "@/api/server";
import { getRequestLocale } from "@/i18n/request";
import { getRawInventoryItems } from "@/services/inventoryService";
import type {
  FocusActivity,
  FocusActivityResponseDTO,
  FocusableTaskItem,
  FocusRecord,
  FocusRecordResponseDTO,
} from "@/types/focus";
import type { InventoryItemResponseDTO } from "@/types/inventory";
import {
  type FocusRecordsPageResult,
  mapFocusActivities,
  mapFocusRecords,
  normalizeFocusRecordsPage,
} from "@/utils/focusMapper";

export type { FocusRecordsPageResult };

export interface FocusPageData {
  activities: FocusActivity[];
  backpackItems: InventoryItemResponseDTO[];
  allInventoryItems: InventoryItemResponseDTO[];
  initialRecords: FocusRecord[];
  totalRecordsCount: number;
  hasMoreRecords: boolean;
  initialLoadedRecordsPage: number;
  focusableTasks: FocusableTaskItem[];
}

/**
 * Busca a lista bruta de atividades de foco do usuário.
 * Cacheada de forma privada no Router Cache do navegador por 5 minutos (`catalog`).
 */
export async function getRawFocusActivities(): Promise<
  FocusActivityResponseDTO[]
> {
  "use cache: private";
  cacheLife("catalog");
  cacheTag("focus-activities");

  const { data, error } = await serverApi.GET("/focus-activities");

  if (error || !data) {
    return [];
  }

  return data;
}

/**
 * Carrega atividades cadastradas e itens da mochila com status IN_FOCUS.
 * Reutiliza `getRawInventoryItems()` (deduplicado com o layout `(main)`) e filtra
 * em memória os itens em foco, evitando uma chamada HTTP separada.
 */
export async function getFocusActivitiesAndItems(): Promise<{
  activities: FocusActivity[];
  backpackItems: InventoryItemResponseDTO[];
  allInventoryItems: InventoryItemResponseDTO[];
}> {
  const [rawActivities, allInventoryItems, locale] = await Promise.all([
    getRawFocusActivities(),
    getRawInventoryItems(),
    getRequestLocale(),
  ]);

  const activities = mapFocusActivities(rawActivities, locale);
  const backpackItems: InventoryItemResponseDTO[] = allInventoryItems.filter(
    (item) => item.status === "IN_FOCUS",
  );

  return { activities, backpackItems, allInventoryItems };
}

async function fetchFocusRecordsPageUncached(
  page = 0,
  size = 100,
): Promise<FocusRecordsPageResult | null> {
  const safePage = Math.max(page, 0);
  const safeSize = Math.min(Math.max(size, 1), 100);
  const { data: myRecordsPage, error } = await serverApi
    .GET("/focus-records/me", {
      params: {
        query: { page: safePage, size: safeSize },
      },
    })
    .catch(() => ({ data: null, error: true }));

  if (error || !myRecordsPage?.content) {
    return null;
  }

  return normalizeFocusRecordsPage(myRecordsPage, safePage);
}

/**
 * Busca uma página bruta de registros de foco do usuário com metadados de paginação (`private30`).
 */
export async function fetchUserFocusRecordsPage(
  page = 0,
  size = 100,
): Promise<FocusRecordsPageResult | null> {
  "use cache: private";
  cacheLife("private30");
  cacheTag("focus-records");

  return fetchFocusRecordsPageUncached(page, size);
}

/**
 * Busca os DTOs brutos de registros recentes de foco do usuário (atividades e tarefas)
 * delegando para a consulta cacheada de registros.
 */
export async function fetchRawUserFocusRecords(): Promise<
  FocusRecordResponseDTO[]
> {
  const firstPage = await fetchUserFocusRecordsPage(0, 100);
  return firstPage ? firstPage.records : [];
}

/**
 * Carrega os registros recentes de foco (atividades, tarefas e cupons) para visualização na sidebar.
 */
export async function getFocusInitialRecords(
  activities: FocusActivity[],
  prefetchedRawRecords?: FocusRecordResponseDTO[],
  inventoryItems: InventoryItemResponseDTO[] = [],
): Promise<FocusRecord[]> {
  const rawRecords =
    prefetchedRawRecords !== undefined
      ? prefetchedRawRecords
      : await fetchRawUserFocusRecords();
  const initialRecords = mapFocusRecords(
    rawRecords,
    activities,
    undefined,
    inventoryItems,
  );

  // Ordena do mais recente para o mais antigo
  initialRecords.sort(
    (a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime(),
  );

  return initialRecords;
}

/**
 * Carrega as tarefas Diárias e Afazeres pendentes do usuário para vínculo rápido no Palco de Foco.
 * Respeita o limite de ambientes ativos no plano Free (somente-leitura não recebe novas sessões concluídas).
 */
export async function getFocusableTasks(): Promise<FocusableTaskItem[]> {
  "use cache: private";
  cacheLife("private30");
  cacheTag("tasks", "kanban", "workspaces", "user");

  try {
    const { data, error } = await serverApi.GET("/tasks/focusable");
    if (error || !Array.isArray(data)) return [];
    return data;
  } catch {
    return [];
  }
}

async function fetchInitialRecordsBundle(): Promise<{
  combinedRawRecords?: FocusRecordResponseDTO[];
  lastFetchedPage: FocusRecordsPageResult | null;
}> {
  const firstRecordsPage = await fetchUserFocusRecordsPage(0, 100);
  if (!firstRecordsPage) {
    return { combinedRawRecords: undefined, lastFetchedPage: null };
  }

  let combinedRawRecords = firstRecordsPage.records;
  let lastFetchedPage = firstRecordsPage;

  if (firstRecordsPage.hasMore) {
    const extraPageNumbers = [1];
    if (firstRecordsPage.totalPages > 2) {
      extraPageNumbers.push(2);
    }
    const extraPages = (
      await Promise.all(
        extraPageNumbers.map((page) => fetchUserFocusRecordsPage(page, 100)),
      )
    ).filter((page): page is FocusRecordsPageResult => Boolean(page));

    if (extraPages.length > 0) {
      combinedRawRecords = [
        ...firstRecordsPage.records,
        ...extraPages.flatMap((page) => page.records),
      ];
      lastFetchedPage = extraPages[extraPages.length - 1];
    }
  }

  return { combinedRawRecords, lastFetchedPage };
}

/**
 * Obtém todos os dados iniciais necessários para a renderização da tela de Foco.
 */
export async function getFocusPageData(): Promise<FocusPageData> {
  const [
    { activities, backpackItems, allInventoryItems },
    focusableTasks,
    { combinedRawRecords, lastFetchedPage },
  ] = await Promise.all([
    getFocusActivitiesAndItems(),
    getFocusableTasks(),
    fetchInitialRecordsBundle(),
  ]);

  const initialRecords = await getFocusInitialRecords(
    activities,
    combinedRawRecords,
    allInventoryItems,
  );

  return {
    activities,
    backpackItems,
    allInventoryItems,
    initialRecords,
    totalRecordsCount: lastFetchedPage
      ? lastFetchedPage.totalElements
      : initialRecords.length,
    hasMoreRecords: lastFetchedPage ? lastFetchedPage.hasMore : false,
    initialLoadedRecordsPage: lastFetchedPage ? lastFetchedPage.currentPage : 0,
    focusableTasks,
  };
}
