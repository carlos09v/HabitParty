import { cacheLife, cacheTag } from "next/cache";
import { serverApi } from "@/api/server";
import type {
  InventoryItem,
  InventoryItemResponseDTO,
} from "@/types/inventory";
import { mapAndGroupInventory } from "@/utils/inventoryMapper";

export interface InventoryPageData {
  items: InventoryItem[];
}

/**
 * Busca a lista bruta de itens do inventário do usuário.
 * Cacheada de forma privada no cliente por 30s (`private30`) e deduplicada por requisição
 * entre `(main)/layout.tsx`, `focusService` e `inventoryService`.
 */
export async function getRawInventoryItems(): Promise<
  InventoryItemResponseDTO[]
> {
  "use cache: private";
  cacheLife("private30");
  cacheTag("inventory");

  const { data, error } = await serverApi.GET("/inventory");

  if (error || !data) {
    return [];
  }

  return data;
}

/**
 * Carrega e agrupa todos os itens disponíveis e em foco da mochila do usuário.
 */
export async function getInventoryData(): Promise<InventoryPageData> {
  const inventoryData = await getRawInventoryItems();
  const items = mapAndGroupInventory(inventoryData);
  return { items };
}
