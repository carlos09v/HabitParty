import { serverApi } from "@/api/server";
import type { InventoryItem } from "@/types/inventory";
import { mapAndGroupInventory } from "@/utils/inventoryMapper";

export interface InventoryPageData {
  items: InventoryItem[];
}

/**
 * Carrega e agrupa todos os itens disponíveis e em foco da mochila do usuário.
 */
export async function getInventoryData(): Promise<InventoryPageData> {
  const { data: inventoryData, error } = await serverApi.GET("/inventory", {
    next: { tags: ["inventory"] },
  });

  if (error || !inventoryData) {
    return { items: [] };
  }

  const items = mapAndGroupInventory(inventoryData);
  return { items };
}
