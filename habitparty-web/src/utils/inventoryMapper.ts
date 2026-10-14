import type { components } from "@/api/schema";
import type { InventoryItem } from "@/types/inventory";
import {
  BACKEND_TO_UI_PACKAGE,
  BACKEND_TO_UI_REWARD_TYPE,
} from "./rewardMapper";

type InventoryItemResponseDTO =
  components["schemas"]["InventoryItemResponseDTO"];

/**
 * Agrupa itens do inventário disponíveis por rewardId, calculando quantidades
 * e preenchendo a entidade InventoryItem usada pelos componentes da UI.
 */
export function mapAndGroupInventory(
  items: InventoryItemResponseDTO[],
): InventoryItem[] {
  const grouped = new Map<string, InventoryItem>();

  for (const dto of items) {
    if (dto.status !== "AVAILABLE") continue;

    const rewardId = dto.rewardId || dto.inventoryItemId || "unknown";

    if (grouped.has(rewardId)) {
      const existing = grouped.get(rewardId);
      if (existing) {
        existing.quantity += 1;
      }
    } else {
      const rawType = dto.rewardType || "SINGLE_USE";
      const mappedType = BACKEND_TO_UI_REWARD_TYPE[rawType] || "SingleUse";
      const packageLevel = dto.rewardPackageLevel
        ? BACKEND_TO_UI_PACKAGE[dto.rewardPackageLevel]
        : undefined;

      const iconName =
        dto.rewardIcon ||
        (rawType === "MISTERY_BOX" ? "mystery_box" : "gamepad");

      grouped.set(rewardId, {
        id: dto.inventoryItemId || rewardId,
        name: dto.rewardName || "",
        description: "",
        itemType: dto.rewardType || "Consumable",
        quantity: 1,
        acquiredAt: new Date().toISOString(),
        reward: {
          id: rewardId,
          title: dto.rewardName || "",
          description: "Item de inventário",
          type: mappedType,
          category: "Entretenimento",
          price: dto.rewardPrice || 0,
          baseDurationMinutes: dto.remainingMinutes,
          iconName,
          icon: iconName,
          packageLevel,
        },
      });
    }
  }

  return Array.from(grouped.values());
}
