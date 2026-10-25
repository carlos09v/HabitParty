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
    if (dto.status !== "AVAILABLE" && dto.status !== "IN_FOCUS") continue;

    const rewardId = dto.rewardId || dto.inventoryItemId || "unknown";
    const statusKey = dto.status || "AVAILABLE";

    const isCoupon =
      dto.rewardType === "TIME_BASED" ||
      (dto.remainingSeconds !== undefined && dto.remainingSeconds !== null);

    // Cupons com tempos restantes diferentes NÃO devem ser agrupados juntos
    const remKey =
      isCoupon &&
      dto.remainingSeconds !== undefined &&
      dto.remainingSeconds !== null
        ? `_rem_${dto.remainingSeconds}`
        : isCoupon
          ? "_rem_full"
          : "";

    const groupKey = `${rewardId}_${statusKey}${remKey}`;

    if (grouped.has(groupKey)) {
      const existing = grouped.get(groupKey);
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

      grouped.set(groupKey, {
        id: dto.inventoryItemId || rewardId,
        inventoryItemId: dto.inventoryItemId,
        name: dto.rewardName || "",
        description: "",
        itemType: dto.rewardType || "Consumable",
        status: dto.status,
        quantity: 1,
        remainingSeconds: dto.remainingSeconds,
        reward: {
          id: rewardId,
          title: dto.rewardName || "",
          description: "Item de inventário",
          type: mappedType,
          category: "Entretenimento",
          price: dto.rewardPrice || 0,
          baseDurationMinutes:
            dto.remainingSeconds !== undefined && dto.remainingSeconds !== null
              ? Math.max(1, Math.ceil(dto.remainingSeconds / 60))
              : undefined,
          iconName,
          icon: iconName,
          packageLevel,
        },
      });
    }
  }

  return Array.from(grouped.values());
}
