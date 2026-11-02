import { getTranslations } from "next-intl/server";
import { Loading } from "@/components/ui/Loading";

export default async function InventoryLoading() {
  const t = await getTranslations("inventory.loading");

  return (
    <div className="flex-1 flex items-center justify-center min-h-[50vh] p-8">
      <Loading size="lg" label={t("label")} />
    </div>
  );
}
