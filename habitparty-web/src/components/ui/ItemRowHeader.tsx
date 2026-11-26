import { useTranslations } from "next-intl";
import { cn } from "@/utils";
import { CATALOG_ROW_GRID_CLASS } from "@/utils/catalogLayout";

export interface ItemRowHeaderProps {
  mode?: "reward" | "inventory";
}

export function ItemRowHeader({ mode = "reward" }: ItemRowHeaderProps) {
  const t = useTranslations("ui.itemCatalog.header");

  return (
    <div
      className={cn(
        "hidden text-xs font-semibold text-neutral-400 border-b border-white/10 select-none py-2",
        CATALOG_ROW_GRID_CLASS,
      )}
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
