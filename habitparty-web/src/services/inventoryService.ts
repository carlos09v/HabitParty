import { cacheLife, cacheTag } from "next/cache";
import { serverApi } from "@/api/server";
import { getRewardsData } from "@/services/rewardService";
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
 * Carrega e agrupa todos os itens disponíveis e em foco da mochila do usuário,
 * enriquecendo metadados visuais (categoria e descrição) a partir do catálogo cacheado de recompensas.
 */
export async function getInventoryData(): Promise<InventoryPageData> {
  const [inventoryData, { rewards }] = await Promise.all([
    getRawInventoryItems(),
    getRewardsData(),
  ]);
  const items = mapAndGroupInventory(inventoryData, rewards);
  return { items };
}
