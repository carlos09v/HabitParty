import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { InventoryContainer } from "@/components/inventory/InventoryContainer";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { ScopedIntlProvider } from "@/i18n/ScopedIntlProvider";
import { getInventoryData } from "@/services/inventoryService";
import { getCurrentUser } from "@/services/userService";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("inventory.metadata");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function InventoryPage() {
  const [{ items: initialItems }, user] = await Promise.all([
    getInventoryData(),
    getCurrentUser(),
  ]);

  return (
    <ScopedIntlProvider scope="inventory">
      <PageWrapper>
        <InventoryContainer
          initialItems={initialItems}
          initialIsPremium={Boolean(user?.isPremium)}
          initialExperienceMode={user?.experienceMode ?? "PRODUCTIVITY"}
        />
      </PageWrapper>
    </ScopedIntlProvider>
  );
}
