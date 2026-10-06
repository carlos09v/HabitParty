import { serverApi } from "@/api/server";
import { InventoryContainer } from "@/components/inventory/InventoryContainer";
import { PageWrapper } from "@/components/layout/PageWrapper";
import type {
  InventoryItem,
  InventoryItemResponseDTO,
} from "@/types/inventory";
import type { PackageLevel, RewardCategory, RewardType } from "@/types/reward";
import { getCompactMode } from "@/utils/cookies";

function mapAndGroupInventory(
  items: InventoryItemResponseDTO[],
): InventoryItem[] {
  const grouped = new Map<string, InventoryItem>();

  const typeMap: Record<string, RewardType> = {
    SINGLE_USE: "SingleUse",
    TIME_BASED: "TimeBased",
    MISTERY_BOX: "MysteryBox",
  };

  const packageMap: Record<string, PackageLevel> = {
    BASIC: "Básico",
    PREMIUM: "Premium",
    EPIC: "Épico",
    LEGENDARY: "Lendário",
  };

  for (const dto of items) {
    if (dto.status !== "AVAILABLE") continue; // Só mostra na mochila os disponíveis

    const rewardId = dto.rewardId || "unknown";

    if (grouped.has(rewardId)) {
      grouped.get(rewardId)!.quantity += 1;
    } else {
      grouped.set(rewardId, {
        name: dto.rewardName || "",
        description: "",
        itemType: dto.rewardType || "Consumable",
        id: dto.inventoryItemId || "", // Ou um id gerado baseado no grupo
        quantity: 1,
        acquiredAt: new Date().toISOString(), // Fallback
        reward: {
          id: rewardId,
          title: dto.rewardName || "",
          description: "Item de inventário", // backend não retorna description aqui
          type: dto.rewardType
            ? typeMap[dto.rewardType] || "SingleUse"
            : "SingleUse",
          category: "Entretenimento" as RewardCategory, // Fallback, não tem na dto
          price: dto.rewardPrice || 0,
          baseDurationMinutes:
            (dto as any).baseDurationMinutes || dto.remainingMinutes,
          iconName: (dto.rewardIcon as any) || "joystick",
          packageLevel: dto.rewardPackageLevel
            ? packageMap[dto.rewardPackageLevel]
            : undefined,
        },
      });
    }
  }

  return Array.from(grouped.values());
}

export default async function InventoryPage() {
  const isCompact = await getCompactMode();

  const { data: inventoryData, error } = await serverApi.GET("/inventory", {
    next: { tags: ["inventory"] },
  });

  const initialItems = inventoryData ? mapAndGroupInventory(inventoryData) : [];

  return (
    <PageWrapper isCompact={isCompact}>
      <InventoryContainer isCompact={isCompact} initialItems={initialItems} />
    </PageWrapper>
  );
}
