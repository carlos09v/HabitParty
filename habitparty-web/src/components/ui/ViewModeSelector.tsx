import { LayoutGrid, List } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/utils";

export type ViewMode = "card" | "list";

export interface ViewModeSelectorProps {
  value: ViewMode | string;
  onChange: (mode: ViewMode) => void;
  isCompact?: boolean;
  className?: string;
}

export function ViewModeSelector({
  value,
  onChange,
  isCompact = false,
  className,
}: ViewModeSelectorProps) {
  const t = useTranslations("ui.viewMode");
  const activeMode: ViewMode = value === "list" ? "list" : "card";

  return (
    <fieldset
      className={cn("flex items-center gap-3 border-none p-0 m-0", className)}
      aria-label={t("groupAria")}
    >
      <button
        type="button"
        onClick={() => onChange("card")}
        aria-pressed={activeMode === "card"}
        title={t("gridTitle")}
        aria-label={t("gridAria")}
        className={cn(
          "rounded-[6px] transition-all cursor-pointer flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-gold/50",
          isCompact ? "p-1" : "p-1.5",
          activeMode === "card"
            ? "bg-background border border-gold/50 text-neutral-100 shadow-xs"
            : "border border-transparent text-neutral-400 hover:text-neutral-100 hover:bg-surface-hover/50",
        )}
      >
        <LayoutGrid size={isCompact ? 16 : 18} aria-hidden="true" />
      </button>

      <button
        type="button"
        onClick={() => onChange("list")}
        aria-pressed={activeMode === "list"}
        title={t("listTitle")}
        aria-label={t("listAria")}
        className={cn(
          "rounded-[6px] transition-all cursor-pointer flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-gold/50",
          isCompact ? "p-1" : "p-1.5",
          activeMode === "list"
            ? "bg-background border border-gold/50 text-neutral-100 shadow-xs"
            : "border border-transparent text-neutral-400 hover:text-neutral-100 hover:bg-surface-hover/50",
        )}
      >
        <List size={isCompact ? 16 : 18} aria-hidden="true" />
      </button>
    </fieldset>
  );
}
