import { Pin, PinOff } from "lucide-react";
import { cn } from "@/utils/cn";

interface GalleryPinButtonProps {
  isPinned: boolean;
  pinnedLabel: string;
  pinLabel: string;
  unpinLabel: string;
  onPin: () => void;
  onUnpin?: () => void;
}

/**
 * Par de botões Fixar / Desafixar da vitrine compartilhado pelos cards de Conquistas e Artefatos.
 */
export function GalleryPinButton({
  isPinned,
  pinnedLabel,
  pinLabel,
  unpinLabel,
  onPin,
  onUnpin,
}: GalleryPinButtonProps) {
  return (
    <div className="inline-flex items-center gap-1 shrink-0">
      <button
        type="button"
        onClick={onPin}
        className={cn(
          "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer whitespace-nowrap shrink-0",
          isPinned
            ? "bg-gold/20 border-gold text-amber-700 dark:text-gold"
            : "bg-surface/70 border-neutral-700 text-neutral-200 hover:border-gold/50 hover:text-amber-700 dark:border-primary/25 dark:text-neutral-300 dark:hover:text-gold",
        )}
      >
        <Pin size={11} aria-hidden="true" />
        <span>{isPinned ? pinnedLabel : pinLabel}</span>
      </button>
      {isPinned && onUnpin && (
        <button
          type="button"
          onClick={onUnpin}
          aria-label={unpinLabel}
          title={unpinLabel}
          className="inline-flex items-center justify-center p-1 rounded-lg border border-neutral-700 bg-surface/70 text-neutral-300 hover:border-red-500/40 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
        >
          <PinOff size={11} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
