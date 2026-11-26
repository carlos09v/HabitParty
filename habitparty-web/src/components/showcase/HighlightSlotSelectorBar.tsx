import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { HighlightSlotInputDTO } from "@/types/showcase";
import { cn } from "@/utils/cn";

interface HighlightSlotSelectorBarProps {
  draftSlots: (HighlightSlotInputDTO | null)[];
  activeSlot: number;
  onSelectSlot: (slotIdx: number) => void;
  onClearSlot: (slotIdx: number) => void;
  getSlotTitle: (slotItem: HighlightSlotInputDTO | null) => string;
}

export function HighlightSlotSelectorBar({
  draftSlots,
  activeSlot,
  onSelectSlot,
  onClearSlot,
  getSlotTitle,
}: HighlightSlotSelectorBarProps) {
  const t = useTranslations("showcase.pickerModal");
  const tHighlights = useTranslations("showcase.highlights");

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
      {([0, 1, 2, 3] as const).map((slotIdx) => {
        const slotItem = draftSlots[slotIdx] ?? null;
        const isSelectedSlot = activeSlot === slotIdx;
        return (
          <div
            key={`picker-slot-${slotIdx}`}
            className={cn(
              "relative rounded-xl border transition-colors",
              isSelectedSlot
                ? "border-gold bg-gold/15 shadow-glow-gold-xs"
                : "border-neutral-700 bg-card hover:border-primary/45 dark:border-primary/25 dark:bg-surface/60",
            )}
          >
            <button
              type="button"
              aria-pressed={isSelectedSlot}
              onClick={() => onSelectSlot(slotIdx)}
              className={cn(
                "w-full p-2.5 flex flex-col justify-between gap-1 text-left rounded-xl cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                slotItem && "pr-8",
              )}
            >
              <span className="text-label-m font-extrabold uppercase tracking-wider text-amber-700 dark:text-gold block">
                {tHighlights("slotLabel", { index: slotIdx + 1 })}
              </span>
              <span
                className={cn(
                  "text-xs font-bold truncate block w-full",
                  slotItem ? "text-neutral-100" : "text-neutral-400 italic",
                )}
              >
                {getSlotTitle(slotItem)}
              </span>
            </button>
            {slotItem && (
              <button
                type="button"
                onClick={() => onClearSlot(slotIdx)}
                className="absolute top-2 right-2 text-neutral-400 hover:text-red-400 p-1 rounded-md cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60"
                aria-label={`${t("clearSlot")} #${slotIdx + 1}`}
                title={t("clearSlot")}
              >
                <Trash2 size={12} aria-hidden="true" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
