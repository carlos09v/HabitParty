"use server";

import { getTranslations } from "next-intl/server";
import type { components } from "@/api/schema";
import { serverApi } from "@/api/server";
import { invalidateTaskDomainTags } from "./cacheInvalidation";
import { type ActionState, getErrorMessage } from "./types";

type CreateChecklistItemDTO = components["schemas"]["CreateChecklistItemDTO"];
type ChecklistItemResponseDTO =
  components["schemas"]["ChecklistItemResponseDTO"];

function invalidateChecklistTags() {
  invalidateTaskDomainTags();
}

/**
 * Adiciona um novo item de checklist vinculado a uma tarefa
 */
export async function addChecklistItem(
  taskId: string,
  payload: CreateChecklistItemDTO,
): Promise<ActionState<ChecklistItemResponseDTO>> {
  const t = await getTranslations("tasks.actions");
  try {
    const { data, error } = await serverApi.POST("/tasks/{taskId}/checklists", {
      params: { path: { taskId } },
      body: payload,
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("addChecklistFailed")),
      };
    }

    invalidateChecklistTags();

    return { success: true, data: data as ChecklistItemResponseDTO };
  } catch (err) {
    console.error("[ChecklistAction:Add]", err);
    return {
      success: false,
      error: t("communicationError"),
    };
  }
}

/**
 * Atualiza o texto de um item de checklist
 */
export async function updateChecklistItem(
  itemId: string,
  payload: CreateChecklistItemDTO,
): Promise<ActionState<ChecklistItemResponseDTO>> {
  const t = await getTranslations("tasks.actions");
  try {
    const { data, error } = await serverApi.PUT("/tasks/checklists/{itemId}", {
      params: { path: { itemId } },
      body: payload,
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("updateChecklistFailed")),
      };
    }

    invalidateChecklistTags();

    return { success: true, data: data as ChecklistItemResponseDTO };
  } catch (err) {
    console.error("[ChecklistAction:Update]", err);
    return {
      success: false,
      error: t("communicationError"),
    };
  }
}

/**
 * Alterna (toggle) a conclusão do checkbox de um item de checklist
 */
export async function toggleChecklistItem(
  itemId: string,
): Promise<ActionState<ChecklistItemResponseDTO>> {
  const t = await getTranslations("tasks.actions");
  try {
    const { data, error } = await serverApi.PATCH(
      "/tasks/checklists/{itemId}/toggle",
      {
        params: { path: { itemId } },
      },
    );

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("toggleChecklistFailed")),
      };
    }

    invalidateChecklistTags();

    return { success: true, data: data as ChecklistItemResponseDTO };
  } catch (err) {
    console.error("[ChecklistAction:Toggle]", err);
    return {
      success: false,
      error: t("communicationError"),
    };
  }
}

/**
 * Alterna o status de etapa recompensada de um item de checklist
 * (exclusivo para Daily/To-Do na dificuldade Difícil, máximo 4 por tarefa).
 */
export async function toggleChecklistItemReward(
  itemId: string,
): Promise<ActionState<ChecklistItemResponseDTO>> {
  const t = await getTranslations("tasks.actions");
  try {
    const { data, error } = await serverApi.PATCH(
      "/tasks/checklists/{itemId}/reward",
      {
        params: { path: { itemId } },
      },
    );

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("toggleChecklistRewardFailed")),
      };
    }

    invalidateChecklistTags();

    return { success: true, data: data as ChecklistItemResponseDTO };
  } catch (err) {
    console.error("[ChecklistAction:ToggleReward]", err);
    return {
      success: false,
      error: t("communicationError"),
    };
  }
}

/**
 * Remove um item do checklist
 */
export async function deleteChecklistItem(
  itemId: string,
): Promise<ActionState<void>> {
  const t = await getTranslations("tasks.actions");
  try {
    const { error } = await serverApi.DELETE("/tasks/checklists/{itemId}", {
      params: { path: { itemId } },
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("deleteChecklistFailed")),
      };
    }

    invalidateChecklistTags();

    return { success: true, data: undefined };
  } catch (err) {
    console.error("[ChecklistAction:Delete]", err);
    return {
      success: false,
      error: t("communicationError"),
    };
  }
}

/**
 * Clona todos os itens válidos de um checklist para uma nova tarefa em ordem sequencial,
 * invalidando o cache de tarefas apenas uma vez ao final.
 */
export async function cloneTaskChecklistItems(
  newTaskId: string,
  items?: { name?: string; isRewarded?: boolean; isCompleted?: boolean }[],
  options?: { skipInvalidation?: boolean },
): Promise<ChecklistItemResponseDTO[]> {
  if (!items || items.length === 0) return [];
  const validItems = items.filter((item) => Boolean(item.name?.trim()));
  if (validItems.length === 0) return [];

  // Sequencial intencionalmente: ChecklistItemJpaEntity não possui orderIndex no banco,
  // portanto a ordem de exibição depende diretamente da ordem de inserção.
  const createdItems: ChecklistItemResponseDTO[] = [];
  const pendingCompletedToggles: Array<{ index: number; itemId: string }> = [];
  for (const item of validItems) {
    try {
      const { data } = await serverApi.POST("/tasks/{taskId}/checklists", {
        params: { path: { taskId: newTaskId } },
        body: {
          name: item.name as string,
          isRewarded: Boolean(item.isRewarded),
        },
      });
      if (data) {
        const created = data as ChecklistItemResponseDTO;
        const pushIndex = createdItems.push(created) - 1;
        if (item.isCompleted && created.id) {
          pendingCompletedToggles.push({
            index: pushIndex,
            itemId: created.id,
          });
        }
      }
    } catch (err) {
      console.error("[ChecklistAction:Clone]", err);
    }
  }

  if (pendingCompletedToggles.length > 0) {
    await Promise.all(
      pendingCompletedToggles.map(async ({ index, itemId }) => {
        try {
          const { data: toggled } = await serverApi.PATCH(
            "/tasks/checklists/{itemId}/toggle",
            {
              params: { path: { itemId } },
            },
          );
          if (toggled) {
            createdItems[index] = toggled as ChecklistItemResponseDTO;
          }
        } catch (err) {
          console.error("[ChecklistAction:CloneToggle]", err);
        }
      }),
    );
  }

  if (!options?.skipInvalidation) {
    invalidateChecklistTags();
  }

  return createdItems;
}

export type ChecklistSnapshotItem = {
  id?: string;
  name?: string;
  isCompleted?: boolean;
  isRewarded?: boolean;
};

/**
 * Persiste em lote as alterações de checklist feitas localmente (ex: no modal de edição),
 * comparando o estado inicial com o estado final. Executado somente ao salvar a tarefa.
 * Retorna o checklist final (com IDs reais) e a quantidade de operações que falharam.
 */
export async function syncTaskChecklistChanges(
  taskId: string,
  initialItems: ChecklistSnapshotItem[],
  currentItems: ChecklistSnapshotItem[],
  options?: { skipInvalidation?: boolean; skipRewardDemotionSync?: boolean },
): Promise<{ items: ChecklistItemResponseDTO[]; failedCount: number }> {
  const isPersisted = (item: ChecklistSnapshotItem) =>
    Boolean(item.id) && !item.id?.startsWith("temp-");

  const initialById = new Map(
    initialItems.filter(isPersisted).map((item) => [item.id as string, item]),
  );
  const currentIds = new Set(
    currentItems.filter(isPersisted).map((item) => item.id as string),
  );

  let failedCount = 0;
  let hasChanges = false;

  const call = async <T>(
    fn: () => Promise<{ data?: T; error?: unknown }>,
  ): Promise<T | undefined> => {
    hasChanges = true;
    try {
      const { data, error } = await fn();
      if (error) {
        failedCount++;
        return undefined;
      }
      return data;
    } catch (err) {
      console.error("[ChecklistAction:Sync]", err);
      failedCount++;
      return undefined;
    }
  };

  const syncPersistedItem = async (
    item: ChecklistSnapshotItem,
    original: ChecklistSnapshotItem | undefined,
    name: string,
  ): Promise<ChecklistItemResponseDTO> => {
    const itemId = item.id as string;
    let resolved: ChecklistItemResponseDTO = item as ChecklistItemResponseDTO;
    const rewardChanged =
      Boolean(original?.isRewarded) !== Boolean(item.isRewarded);
    const shouldSkipRewardDemotion =
      Boolean(options?.skipRewardDemotionSync) &&
      original?.name === name &&
      Boolean(original?.isRewarded) &&
      !item.isRewarded;

    if (
      original &&
      (original.name !== name || (rewardChanged && !shouldSkipRewardDemotion))
    ) {
      const updated = await call(() =>
        serverApi.PUT("/tasks/checklists/{itemId}", {
          params: { path: { itemId } },
          body: { name, isRewarded: Boolean(item.isRewarded) },
        }),
      );
      if (updated) resolved = updated as ChecklistItemResponseDTO;
    }
    if (
      original &&
      Boolean(original.isCompleted) !== Boolean(item.isCompleted)
    ) {
      const toggled = await call(() =>
        serverApi.PATCH("/tasks/checklists/{itemId}/toggle", {
          params: { path: { itemId } },
        }),
      );
      if (toggled) resolved = toggled as ChecklistItemResponseDTO;
    }
    return resolved;
  };

  // Fase 1: Remoções + atualizações que NÃO promovem etapas a recompensadas (inclui rebaixamentos true -> false).
  // Garante liberação de vagas do limite 4/4 antes de promoções ou criações com isRewarded: true.
  const persistedResults = new Map<string, ChecklistItemResponseDTO>();
  const phase1Updates: Array<Promise<void>> = [];
  const phase2Promotions: Array<{
    item: ChecklistSnapshotItem;
    original?: ChecklistSnapshotItem;
    name: string;
  }> = [];

  for (const item of currentItems) {
    const name = item.name?.trim();
    if (!name || !isPersisted(item)) continue;

    const itemId = item.id as string;
    const original = initialById.get(itemId);
    const isRewardPromotion = Boolean(item.isRewarded) && !original?.isRewarded;

    if (isRewardPromotion) {
      phase2Promotions.push({ item, original, name });
    } else {
      phase1Updates.push(
        syncPersistedItem(item, original, name).then((resolved) => {
          persistedResults.set(itemId, resolved);
        }),
      );
    }
  }

  await Promise.all([
    ...[...initialById.keys()]
      .filter((id) => !currentIds.has(id))
      .map((itemId) =>
        call(() =>
          serverApi.DELETE("/tasks/checklists/{itemId}", {
            params: { path: { itemId } },
          }),
        ),
      ),
    ...phase1Updates,
  ]);

  // Fase 2: Promoções de isRewarded (false -> true) após vagas já liberadas na Fase 1
  if (phase2Promotions.length > 0) {
    await Promise.all(
      phase2Promotions.map(async ({ item, original, name }) => {
        const resolved = await syncPersistedItem(item, original, name);
        persistedResults.set(item.id as string, resolved);
      }),
    );
  }

  const finalItems: ChecklistItemResponseDTO[] = [];
  const pendingNewToggles: Array<{ index: number; itemId: string }> = [];

  for (const item of currentItems) {
    const name = item.name?.trim();
    if (!name) continue;

    if (isPersisted(item)) {
      const resolved = persistedResults.get(item.id as string);
      if (resolved) finalItems.push(resolved);
      continue;
    }

    // Sequencial apenas na criação para preservar ordem de inserção no banco
    const created = (await call(() =>
      serverApi.POST("/tasks/{taskId}/checklists", {
        params: { path: { taskId } },
        body: { name, isRewarded: Boolean(item.isRewarded) },
      }),
    )) as ChecklistItemResponseDTO | undefined;
    if (!created) continue;

    const pushIndex = finalItems.push(created) - 1;
    if (item.isCompleted && created.id) {
      pendingNewToggles.push({ index: pushIndex, itemId: created.id });
    }
  }

  // Toggles de itens recém-criados já possuem ID e podem executar em paralelo sem afetar ordem
  if (pendingNewToggles.length > 0) {
    await Promise.all(
      pendingNewToggles.map(async ({ index, itemId }) => {
        const toggled = await call(() =>
          serverApi.PATCH("/tasks/checklists/{itemId}/toggle", {
            params: { path: { itemId } },
          }),
        );
        if (toggled) {
          finalItems[index] = toggled as ChecklistItemResponseDTO;
        }
      }),
    );
  }

  if (hasChanges && !options?.skipInvalidation) invalidateChecklistTags();

  return { items: finalItems, failedCount };
}
