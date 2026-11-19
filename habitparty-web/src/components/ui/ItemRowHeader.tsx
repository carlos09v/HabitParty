import { useTranslations } from "next-intl";

export interface ItemRowHeaderProps {
  mode?: "reward" | "inventory";
}

export function ItemRowHeader({ mode = "reward" }: ItemRowHeaderProps) {
  const t = useTranslations("ui.itemCatalog.header");

  return (
    <div
      className="hidden md:grid grid-cols-[minmax(0,3.4fr)_minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,0.9fr)_auto] xl:grid-cols-[minmax(0,3fr)_minmax(0,1.2fr)_minmax(0,1.7fr)_minmax(0,1.1fr)_auto] items-center text-xs font-semibold text-neutral-400 border-b border-white/10 select-none gap-2.5 xl:gap-4 px-3.5 xl:px-4 py-2"
      aria-hidden="true"
    >
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <div className="w-4 shrink-0" />
        <div className="shrink-0 w-10" />
        {mode === "inventory" && <div className="shrink-0 w-7" />}
        <span>{mode === "inventory" ? t("item") : t("product")}</span>
      </div>
      <span>{t("type")}</span>
      <span>{t("packageAndCategory")}</span>
      <span>{t("duration")}</span>
      <span className="text-right pr-2">
        {mode === "inventory" ? t("action") : t("priceAndAction")}
      </span>
    </div>
  );
}
