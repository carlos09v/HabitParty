import { getTranslations } from "next-intl/server";
import { Loading } from "@/components/ui/Loading";

export default async function DashboardLoading() {
  const t = await getTranslations("dashboard");
  return (
    <div className="flex-1 flex items-center justify-center min-h-[50vh] p-8">
      <Loading size="lg" label={t("loading")} />
    </div>
  );
}
