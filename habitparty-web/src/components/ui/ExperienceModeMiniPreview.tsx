import { ShieldAlert } from "lucide-react";
import { CoinIcon } from "@/components/ui/CoinIcon";
import { cn } from "@/utils/cn";

export interface ExperienceModeMiniPreviewProps {
  isGamified: boolean;
  label: string;
  sampleTask: string;
  rewardText: string;
  badgeText: string;
  className?: string;
}

/**
 * Live Mini-Preview adaptativo do modo de experiência (Aventura vs Produtividade),
 * compartilhado entre Settings (`ExperienceModeSettings`) e Onboarding (`ExperienceModeSelector`).
 */
export function ExperienceModeMiniPreview({
  isGamified,
  label,
  sampleTask,
  rewardText,
  badgeText,
  className,
}: ExperienceModeMiniPreviewProps) {
  return (
    <div
      aria-live="polite"
      className={cn(
        "flex flex-wrap items-center justify-between gap-2.5 px-4 py-3 rounded-xl bg-surface/70 dark:bg-surface/45 border border-neutral-700/80 dark:border-primary/20 text-xs",
        className,
      )}
    >
      <div className="flex items-center gap-2 text-neutral-300 min-w-0">
        <span className="text-tiny font-bold uppercase tracking-wider text-neutral-400 shrink-0">
          {label}:
        </span>
        <span className="font-semibold text-neutral-100 truncate">
          {sampleTask}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-bold",
            isGamified
              ? "bg-amber-500/12 border-amber-500/30 text-amber-800 dark:bg-gold/15 dark:border-gold/30 dark:text-gold"
              : "bg-info/12 border-info/30 text-info",
          )}
        >
          <CoinIcon size={12} variant={isGamified ? "coin" : "credit"} />
          {rewardText}
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/12 border border-red-500/25 text-red-700 dark:text-red-300 font-semibold">
          <ShieldAlert size={12} aria-hidden="true" />
          {badgeText}
        </span>
      </div>
    </div>
  );
}
