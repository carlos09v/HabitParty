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
  FocusSummaryData,
} from "@/types/focus";
import type { InventoryItemResponseDTO } from "@/types/inventory";
import {
  type FocusRecordsPageResult,
  mapFocusActivities,
  mapFocusRecords,
  normalizeFocusRecordsPage,
  normalizeFocusSummary,
} from "@/utils/focusMapper";

export type { FocusRecordsPageResult };

export const INITIAL_FOCUS_RECORDS_PAGE_SIZE = 20;

export interface FocusCriticalPageData {
  activities: FocusActivity[];
  backpackItems: InventoryItemResponseDTO[];
  allInventoryItems: InventoryItemResponseDTO[];
  focusableTasks: FocusableTaskItem[];
}

export interface FocusInitialHistoryBundle {
  initialSummary: FocusSummaryData | null;
  initialSummaryActivityId: string | null;
  initialRecords: FocusRecord[];
  totalRecordsCount: number;
  hasMoreRecords: boolean;
  initialLoadedRecordsPage: number;
  initialRecordsPageSize: number;
}

export interface FocusPageData
  extends FocusCriticalPageData,
    FocusInitialHistoryBundle {}

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

/**
 * Busca o resumo agregado completo de métricas de foco diretamente no backend (`GET /focus-records/summary`),
 * eliminando o download de centenas de registros só para calcular totais, ofensiva e gráfico semanal.
 */
export async function fetchFocusSummary(
  activityId?: string | null,
): Promise<FocusSummaryData | null> {
  "use cache: private";
  cacheLife("private30");
  cacheTag("focus-records");

  const normalizedActivityId = activityId?.trim() || undefined;
  const { data, error } = await serverApi
    .GET("/focus-records/summary", {
      params: normalizedActivityId
        ? { query: { activityId: normalizedActivityId } }
        : undefined,
    })
    .catch(() => ({ data: null, error: true }));

  if (error || !data) {
    return null;
  }

  return normalizeFocusSummary(data);
}

async function fetchFocusRecordsPageUncached(
  page = 0,
  size = INITIAL_FOCUS_RECORDS_PAGE_SIZE,
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

async function fetchFocusActivityRecordsPageCached(
  activityId: string,
  page = 0,
): Promise<FocusRecordsPageResult | null> {
  "use cache: private";
  cacheLife("private30");
  cacheTag("focus-records");

  const safePage = Math.max(page, 0);
  const { data, error } = await serverApi
    .GET("/focus-records/activity/{activityId}", {
      params: {
        path: { activityId },
        query: { page: safePage },
      },
    })
    .catch(() => ({ data: null, error: true }));

  if (error || !data?.content) {
    return null;
  }

  return normalizeFocusRecordsPage(data, safePage);
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
  timeZone?: string | null,
): Promise<FocusRecord[]> {
  const rawRecords =
    prefetchedRawRecords !== undefined
      ? prefetchedRawRecords
      : await fetchRawUserFocusRecords();
  const initialRecords = mapFocusRecords(
    rawRecords,
    activities,
    timeZone,
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

/**
 * Carrega os dados críticos imediatos para renderizar o Palco de Foco, Atividades e Mochila sem bloquear TTFB.
 */
export async function getFocusCriticalPageData(): Promise<FocusCriticalPageData> {
  const [{ activities, backpackItems, allInventoryItems }, focusableTasks] =
    await Promise.all([getFocusActivitiesAndItems(), getFocusableTasks()]);

  return {
    activities,
    backpackItems,
    allInventoryItems,
    focusableTasks,
  };
}

/**
 * Carrega o resumo agregado exato (`GET /focus-records/summary`) + apenas a 1ª página leve (20 registros)
 * para alimentar a sidebar direita e os indicadores do dia via streaming `<Suspense>`.
 */
export async function getFocusInitialHistoryBundle(
  activities: FocusActivity[],
  allInventoryItems: InventoryItemResponseDTO[],
  options?: {
    initialActivityId?: string | null;
    timeZone?: string | null;
  },
): Promise<FocusInitialHistoryBundle> {
  const requestedActivityId = options?.initialActivityId?.trim() || null;
  const hasValidActivityFilter = Boolean(
    requestedActivityId &&
      activities.some((act) => act.id === requestedActivityId),
  );
  const effectiveActivityId = hasValidActivityFilter
    ? requestedActivityId
    : null;

  const [initialSummary, firstRecordsPage, filteredFirstPage] =
    await Promise.all([
      fetchFocusSummary(effectiveActivityId),
      fetchUserFocusRecordsPage(0, INITIAL_FOCUS_RECORDS_PAGE_SIZE),
      effectiveActivityId
        ? fetchFocusActivityRecordsPageCached(effectiveActivityId, 0)
        : Promise.resolve(null),
    ]);

  const combinedRawRecords: FocusRecordResponseDTO[] = [];
  const seenIds = new Set<string>();
  for (const list of [
    firstRecordsPage?.records ?? [],
    filteredFirstPage?.records ?? [],
  ]) {
    for (const rec of list) {
      if (rec.id && seenIds.has(rec.id)) continue;
      if (rec.id) seenIds.add(rec.id);
      combinedRawRecords.push(rec);
    }
  }

  const initialRecords = await getFocusInitialRecords(
    activities,
    combinedRawRecords,
    allInventoryItems,
    options?.timeZone,
  );

  return {
    initialSummary,
    initialSummaryActivityId: effectiveActivityId,
    initialRecords,
    totalRecordsCount: firstRecordsPage
      ? firstRecordsPage.totalElements
      : initialRecords.length,
    hasMoreRecords: firstRecordsPage ? firstRecordsPage.hasMore : false,
    initialLoadedRecordsPage: firstRecordsPage
      ? firstRecordsPage.currentPage
      : 0,
    initialRecordsPageSize: INITIAL_FOCUS_RECORDS_PAGE_SIZE,
  };
}

/**
 * Obtém todos os dados iniciais necessários para a renderização da tela de Foco.
 */
export async function getFocusPageData(options?: {
  initialActivityId?: string | null;
  timeZone?: string | null;
}): Promise<FocusPageData> {
  const critical = await getFocusCriticalPageData();
  const historyBundle = await getFocusInitialHistoryBundle(
    critical.activities,
    critical.allInventoryItems,
    options,
  );

  return {
    ...critical,
    ...historyBundle,
  };
}
