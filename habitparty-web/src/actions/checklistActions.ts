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
  items?: { name?: string }[],
): Promise<ChecklistItemResponseDTO[]> {
  if (!items || items.length === 0) return [];
  const validItems = items.filter((item) => Boolean(item.name?.trim()));
  if (validItems.length === 0) return [];

  const createdItems: ChecklistItemResponseDTO[] = [];
  for (const item of validItems) {
    try {
      const { data } = await serverApi.POST("/tasks/{taskId}/checklists", {
        params: { path: { taskId: newTaskId } },
        body: { name: item.name as string },
      });
      if (data) {
        createdItems.push(data as ChecklistItemResponseDTO);
      }
    } catch (err) {
      console.error("[ChecklistAction:Clone]", err);
    }
  }

  invalidateChecklistTags();

  return createdItems;
}

type ChecklistSnapshotItem = {
  id?: string;
  name?: string;
  isCompleted?: boolean;
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

  // 1. Remoções
  await Promise.all(
    [...initialById.keys()]
      .filter((id) => !currentIds.has(id))
      .map((itemId) =>
        call(() =>
          serverApi.DELETE("/tasks/checklists/{itemId}", {
            params: { path: { itemId } },
          }),
        ),
      ),
  );

  // 2. Edições de itens existentes em paralelo + inclusões de novos itens em ordem
  const persistedUpdates = new Map<string, Promise<ChecklistItemResponseDTO>>();
  for (const item of currentItems) {
    const name = item.name?.trim();
    if (!name || !isPersisted(item)) continue;

    const itemId = item.id as string;
    const original = initialById.get(itemId);
    persistedUpdates.set(
      itemId,
      (async () => {
        let resolved: ChecklistItemResponseDTO =
          item as ChecklistItemResponseDTO;
        if (original && original.name !== name) {
          const updated = await call(() =>
            serverApi.PUT("/tasks/checklists/{itemId}", {
              params: { path: { itemId } },
              body: { name },
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
      })(),
    );
  }

  await Promise.all(persistedUpdates.values());

  const finalItems: ChecklistItemResponseDTO[] = [];
  for (const item of currentItems) {
    const name = item.name?.trim();
    if (!name) continue;

    if (isPersisted(item)) {
      const resolved = await persistedUpdates.get(item.id as string);
      if (resolved) finalItems.push(resolved);
      continue;
    }

    const created = (await call(() =>
      serverApi.POST("/tasks/{taskId}/checklists", {
        params: { path: { taskId } },
        body: { name },
      }),
    )) as ChecklistItemResponseDTO | undefined;
    if (!created) continue;

    if (item.isCompleted && created.id) {
      const createdId = created.id;
      const toggled = await call(() =>
        serverApi.PATCH("/tasks/checklists/{itemId}/toggle", {
          params: { path: { itemId: createdId } },
        }),
      );
      finalItems.push((toggled as ChecklistItemResponseDTO) ?? created);
    } else {
      finalItems.push(created);
    }
  }

  if (hasChanges) invalidateChecklistTags();

  return { items: finalItems, failedCount };
}
