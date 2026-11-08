import { cacheLife, cacheTag } from "next/cache";
import { serverApi } from "@/api/server";
import { getRequestLocale } from "@/i18n/request";
import { getRawInventoryItems } from "@/services/inventoryService";
import type {
  FocusActivity,
  FocusActivityResponseDTO,
  FocusRecord,
  FocusRecordResponseDTO,
} from "@/types/focus";
import type { InventoryItemResponseDTO } from "@/types/inventory";
import { mapFocusActivities, mapFocusRecords } from "@/utils/focusMapper";

export interface FocusPageData {
  activities: FocusActivity[];
  backpackItems: InventoryItemResponseDTO[];
  initialRecords: FocusRecord[];
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

  return { activities, backpackItems };
}

/**
 * Busca os DTOs brutos de registros recentes de foco usando apenas IDs primitivos ordenados
 * como chave estável do cache privado (`private30`).
 */
async function fetchRawFocusRecordsByActivityIds(
  activityIds: string[],
): Promise<FocusRecordResponseDTO[]> {
  "use cache: private";
  cacheLife("private30");
  cacheTag("focus-records");

  if (activityIds.length === 0) {
    return [];
  }

  const recordsResponses = await Promise.all(
    activityIds.map((activityId) =>
      serverApi
        .GET("/focus-records/activity/{activityId}", {
          params: {
            path: { activityId },
            query: { page: 0 },
          },
        })
        .catch(() => ({ data: null })),
    ),
  );

  const rawRecords: FocusRecordResponseDTO[] = [];
  for (const res of recordsResponses) {
    if (res.data?.content) {
      rawRecords.push(...res.data.content);
    }
  }

  return rawRecords;
}

/**
 * Carrega os registros recentes de foco das atividades para visualização na sidebar.
 */
export async function getFocusInitialRecords(
  activities: FocusActivity[],
): Promise<FocusRecord[]> {
  if (!activities || activities.length === 0) {
    return [];
  }

  const sortedActivityIds = activities
    .map((act) => act.id)
    .filter(Boolean)
    .sort();

  const rawRecords = await fetchRawFocusRecordsByActivityIds(sortedActivityIds);
  const initialRecords = mapFocusRecords(rawRecords, activities);

  // Ordena do mais recente para o mais antigo
  initialRecords.sort(
    (a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime(),
  );

  return initialRecords;
}

/**
 * Obtém todos os dados iniciais necessários para a renderização da tela de Foco.
 */
export async function getFocusPageData(): Promise<FocusPageData> {
  const { activities, backpackItems } = await getFocusActivitiesAndItems();
  const initialRecords = await getFocusInitialRecords(activities);

  return {
    activities,
    backpackItems,
    initialRecords,
  };
}
