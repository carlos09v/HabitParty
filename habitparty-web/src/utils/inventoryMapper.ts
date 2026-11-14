import type { components } from "@/api/schema";
import type { InventoryItem } from "@/types/inventory";
import type { Reward, RewardCategory } from "@/types/reward";
import {
  BACKEND_TO_UI_PACKAGE,
  BACKEND_TO_UI_REWARD_TYPE,
} from "./rewardMapper";

type InventoryItemResponseDTO =
  components["schemas"]["InventoryItemResponseDTO"];

/**
 * Agrupa itens do inventário disponíveis por rewardId, preservando a ordenação por `orderIndex`,
 * rastreando todos os IDs individuais (`itemIds`) da pilha e enriquecendo categoria/descrição
 * a partir do catálogo de recompensas da loja quando disponível.
 */
export function mapAndGroupInventory(
  items: InventoryItemResponseDTO[],
  rewards: Reward[] = [],
): InventoryItem[] {
  const grouped = new Map<string, InventoryItem>();
  const rewardById = new Map<string, Reward>(
    rewards.map((reward) => [reward.id, reward]),
  );

  const sortedItems = [...items].sort(
    (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0),
  );

  for (const dto of sortedItems) {
    if (dto.status !== "AVAILABLE" && dto.status !== "IN_FOCUS") continue;

    const rewardId = dto.rewardId || dto.inventoryItemId || "unknown";
    const statusKey = dto.status || "AVAILABLE";

    const isCoupon =
      dto.rewardType === "TIME_BASED" ||
      (dto.remainingSeconds !== undefined && dto.remainingSeconds !== null);

    const rawType = dto.rewardType || "SINGLE_USE";
    const pkgKey = dto.rewardPackageLevel || "NONE";
    const normalizedName = (dto.rewardName || "").trim().toLowerCase();

    // Cupons com tempos restantes diferentes e Caixas Misteriosas lacradas vs itens abertos NÃO devem ser agrupados juntos
    const remKey =
      isCoupon &&
      dto.remainingSeconds !== undefined &&
      dto.remainingSeconds !== null
        ? `_rem_${dto.remainingSeconds}`
        : isCoupon
          ? "_rem_full"
          : "";

    const groupKey = `${rewardId}_${rawType}_${pkgKey}_${normalizedName}_${statusKey}${remKey}`;

    if (grouped.has(groupKey)) {
      const existing = grouped.get(groupKey);
      if (existing) {
        existing.quantity += 1;
        if (dto.inventoryItemId) {
          existing.itemIds = [
            ...(existing.itemIds ?? [existing.id]),
            dto.inventoryItemId,
          ];
        }
      }
    } else {
      const mappedType = BACKEND_TO_UI_REWARD_TYPE[rawType] || "SingleUse";
      const packageLevel = dto.rewardPackageLevel
        ? BACKEND_TO_UI_PACKAGE[dto.rewardPackageLevel]
        : undefined;

      const storeReward = dto.rewardId
        ? rewardById.get(dto.rewardId)
        : undefined;

      const iconName =
        dto.rewardIcon ||
        storeReward?.iconName ||
        (rawType === "MISTERY_BOX" ? "mystery_box" : "gamepad");

      const resolvedDescription = storeReward?.description || "";
      const fallbackCategory: RewardCategory =
        rawType === "MISTERY_BOX" ? "Sorte" : "Nenhum";
      const resolvedCategory: RewardCategory =
        storeReward?.category || fallbackCategory;
      const primaryItemId = dto.inventoryItemId || rewardId;

      grouped.set(groupKey, {
        id: primaryItemId,
        itemIds: [primaryItemId],
        inventoryItemId: dto.inventoryItemId,
        orderIndex: dto.orderIndex,
        name: dto.rewardName || storeReward?.title || "",
        description: resolvedDescription,
        itemType: dto.rewardType || "Consumable",
        status: dto.status,
        quantity: 1,
        remainingSeconds: dto.remainingSeconds,
        reward: {
          id: rewardId,
          title: dto.rewardName || storeReward?.title || "",
          description: resolvedDescription,
          type: mappedType,
          category: resolvedCategory,
          price: dto.rewardPrice ?? storeReward?.price ?? 0,
          baseDurationMinutes:
            dto.remainingSeconds !== undefined && dto.remainingSeconds !== null
              ? Math.max(1, Math.ceil(dto.remainingSeconds / 60))
              : storeReward?.baseDurationMinutes,
          iconName,
          icon: iconName,
          packageLevel,
          lootItems: dto.lootItems ?? storeReward?.lootItems,
        },
      });
    }
  }

  return Array.from(grouped.values());
}
