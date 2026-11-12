import { cacheLife, cacheTag } from "next/cache";
import { serverApi } from "@/api/server";
import { getRequestLocale } from "@/i18n/request";
import { getRawInventoryItems } from "@/services/inventoryService";
import { fetchWorkspaceBoardColumns } from "@/services/taskService";
import { getWorkspaces } from "@/services/workspaceService";
import type {
  FocusActivity,
  FocusActivityResponseDTO,
  FocusableTaskItem,
  FocusRecord,
  FocusRecordResponseDTO,
} from "@/types/focus";
import type { InventoryItemResponseDTO } from "@/types/inventory";
import { mapFocusActivities, mapFocusRecords } from "@/utils/focusMapper";

export interface FocusPageData {
  activities: FocusActivity[];
  backpackItems: InventoryItemResponseDTO[];
  initialRecords: FocusRecord[];
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
 * Busca os DTOs brutos de registros recentes de foco do usuário (atividades e tarefas)
 * em uma única chamada cacheada (`private30`).
 */
async function fetchRawUserFocusRecords(
  activityIds: string[],
): Promise<FocusRecordResponseDTO[]> {
  "use cache: private";
  cacheLife("private30");
  cacheTag("focus-records");

  const { data: myRecordsPage, error } = await serverApi
    .GET("/focus-records/me", {
      params: {
        query: { page: 0, size: 50 },
      },
    })
    .catch(() => ({ data: null, error: true }));

  if (!error && myRecordsPage?.content) {
    return myRecordsPage.content;
  }

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
 * Carrega os registros recentes de foco (atividades e tarefas) para visualização na sidebar.
 */
export async function getFocusInitialRecords(
  activities: FocusActivity[],
): Promise<FocusRecord[]> {
  const sortedActivityIds = (activities || [])
    .map((act) => act.id)
    .filter(Boolean)
    .sort();

  const rawRecords = await fetchRawUserFocusRecords(sortedActivityIds);
  const initialRecords = mapFocusRecords(rawRecords, activities);

  // Ordena do mais recente para o mais antigo
  initialRecords.sort(
    (a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime(),
  );

  return initialRecords;
}

/**
 * Carrega as tarefas Diárias e Afazeres pendentes do usuário para vínculo rápido no Palco de Foco.
 */
export async function getFocusableTasks(): Promise<FocusableTaskItem[]> {
  try {
    const workspaces = await getWorkspaces();
    if (!workspaces || workspaces.length === 0) return [];

    const boards = await Promise.all(
      workspaces
        .slice(0, 4)
        .filter((ws) => Boolean(ws.id))
        .map(async (ws) => {
          const { columns } = await fetchWorkspaceBoardColumns(ws.id as string);
          return { workspaceName: ws.name || "", columns };
        }),
    );

    const items: FocusableTaskItem[] = [];
    for (const board of boards) {
      for (const col of board.columns) {
        for (const task of col.tasks) {
          const normalizedType = task.type?.toLowerCase();
          if (
            (normalizedType === "daily" || normalizedType === "todo") &&
            !task.completed
          ) {
            items.push({
              id: task.id,
              title: task.title,
              type: normalizedType,
              columnTitle: col.title,
              workspaceName: board.workspaceName,
              totalFocusMinutes: task.totalFocusMinutes ?? 0,
              focusCyclesCount: task.focusCyclesCount ?? 0,
              completed: Boolean(task.completed),
            });
          }
        }
      }
    }

    return items;
  } catch {
    return [];
  }
}

/**
 * Obtém todos os dados iniciais necessários para a renderização da tela de Foco.
 */
export async function getFocusPageData(): Promise<FocusPageData> {
  const [{ activities, backpackItems }, focusableTasks] = await Promise.all([
    getFocusActivitiesAndItems(),
    getFocusableTasks(),
  ]);
  const initialRecords = await getFocusInitialRecords(activities);

  return {
    activities,
    backpackItems,
    initialRecords,
    focusableTasks,
  };
}
