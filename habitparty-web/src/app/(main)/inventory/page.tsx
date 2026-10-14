import { serverApi } from "@/api/server";
import { InventoryContainer } from "@/components/inventory/InventoryContainer";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { getCompactMode } from "@/utils/cookies";
import { mapAndGroupInventory } from "@/utils/inventoryMapper";

export default async function InventoryPage() {
  const isCompact = await getCompactMode();

  const { data: inventoryData } = await serverApi.GET("/inventory", {
    next: { tags: ["inventory"] },
  });

  const initialItems = inventoryData ? mapAndGroupInventory(inventoryData) : [];

  return (
    <PageWrapper isCompact={isCompact}>
      <InventoryContainer isCompact={isCompact} initialItems={initialItems} />
    </PageWrapper>
  );
}
