import { useTranslations } from "next-intl";
import { Loading } from "@/components/ui/Loading";

export default function SettingsLoading() {
  const t = useTranslations("settings.loading");

  return (
    <div className="flex-1 flex items-center justify-center min-h-[50vh] p-8">
      <Loading size="lg" label={t("label")} />
    </div>
  );
}
