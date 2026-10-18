import { serverApi } from "@/api/server";
import type { FocusActivity, FocusRecord } from "@/types/focus";
import type { InventoryItemResponseDTO } from "@/types/inventory";
import { mapFocusActivities, mapFocusRecords } from "@/utils/focusMapper";

export interface FocusPageData {
  activities: FocusActivity[];
  backpackItems: InventoryItemResponseDTO[];
  initialRecords: FocusRecord[];
}

/**
 * Carrega atividades cadastradas e itens da mochila com status IN_FOCUS.
 */
export async function getFocusActivitiesAndItems(): Promise<{
  activities: FocusActivity[];
  backpackItems: InventoryItemResponseDTO[];
}> {
  const [activitiesRes, inventoryRes] = await Promise.all([
    serverApi.GET("/focus-activities", {
      next: { tags: ["focus-activities"] },
    }),
    serverApi.GET("/inventory", {
      params: {
        query: { status: "IN_FOCUS" },
      },
      next: { tags: ["inventory"] },
    }),
  ]);

  const activities = mapFocusActivities(activitiesRes.data);
  const backpackItems: InventoryItemResponseDTO[] = inventoryRes.data || [];

  return { activities, backpackItems };
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

  const initialRecords: FocusRecord[] = [];
  const recordsResponses = await Promise.all(
    activities.map((act) =>
      serverApi
        .GET("/focus-records/activity/{activityId}", {
          params: {
            path: { activityId: act.id },
            query: { page: 0 },
          },
          next: { tags: ["focus-records"] },
        })
        .catch(() => ({ data: null })),
    ),
  );

  for (const res of recordsResponses) {
    if (res.data?.content) {
      initialRecords.push(...mapFocusRecords(res.data.content, activities));
    }
  }

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
