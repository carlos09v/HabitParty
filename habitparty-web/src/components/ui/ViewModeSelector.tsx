import { LayoutGrid, List } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/utils";

export type ViewMode = "card" | "list";

export interface ViewModeSelectorProps {
  value: ViewMode | string;
  onChange: (mode: ViewMode) => void;
  className?: string;
}

export function ViewModeSelector({
  value,
  onChange,
  className,
}: ViewModeSelectorProps) {
  const t = useTranslations("ui.viewMode");
  const activeMode: ViewMode = value === "list" ? "list" : "card";

  return (
    <fieldset
      className={cn(
        "inline-flex items-center gap-0.5 rounded-lg bg-surface border border-white/15 p-0.5 m-0 shadow-xs shrink-0",
        className,
      )}
      aria-label={t("groupAria")}
    >
      <button
        type="button"
        onClick={() => onChange("card")}
        aria-pressed={activeMode === "card"}
        title={t("gridTitle")}
        aria-label={t("gridAria")}
        className={cn(
          "rounded-md transition-colors cursor-pointer flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-gold/50 select-none px-2.5 py-1.5 text-xs",
          activeMode === "card"
            ? "bg-gold/20 border border-gold/50 text-gold font-bold shadow-glow-gold-xs"
            : "border border-transparent text-neutral-400 font-medium hover:text-neutral-100 hover:bg-white/5",
        )}
      >
        <LayoutGrid size={15} aria-hidden="true" />
        <span className="hidden sm:inline">{t("gridLabel")}</span>
      </button>

      <button
        type="button"
        onClick={() => onChange("list")}
        aria-pressed={activeMode === "list"}
        title={t("listTitle")}
        aria-label={t("listAria")}
        className={cn(
          "rounded-md transition-colors cursor-pointer flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-gold/50 select-none px-2.5 py-1.5 text-xs",
          activeMode === "list"
            ? "bg-gold/20 border border-gold/50 text-gold font-bold shadow-glow-gold-xs"
            : "border border-transparent text-neutral-400 font-medium hover:text-neutral-100 hover:bg-white/5",
        )}
      >
        <List size={15} aria-hidden="true" />
        <span className="hidden sm:inline">{t("listLabel")}</span>
      </button>
    </fieldset>
  );
}
