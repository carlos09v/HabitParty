import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { InventoryContainer } from "@/components/inventory/InventoryContainer";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { getInventoryData } from "@/services/inventoryService";
import { getCompactMode } from "@/utils/cookies";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("inventory.metadata");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function InventoryPage() {
  const isCompact = await getCompactMode();
  const { items: initialItems } = await getInventoryData();

  return (
    <PageWrapper isCompact={isCompact}>
      <InventoryContainer isCompact={isCompact} initialItems={initialItems} />
    </PageWrapper>
  );
}
