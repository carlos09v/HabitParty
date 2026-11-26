import { CoinIcon } from "@/components/ui/CoinIcon";
import { cn } from "@/utils";

export type LandingExperienceMode = "essential" | "adventure";

interface LandingModeSwitcherProps {
  mode: LandingExperienceMode;
  onChange: (mode: LandingExperienceMode) => void;
  ariaLabel: string;
  essentialLabel: string;
  adventureLabel: string;
  showIcons?: boolean;
  size?: "sm" | "md";
}

/**
 * Alternador reutilizável entre Modo Essencial (Produtividade) e Modo Aventura (RPG)
 * compartilhado entre `LandingHeroPreview` e `LandingInteractiveDemo`.
 */
export function LandingModeSwitcher({
  mode,
  onChange,
  ariaLabel,
  essentialLabel,
  adventureLabel,
  showIcons = false,
  size = "md",
}: LandingModeSwitcherProps) {
  const isEssential = mode === "essential";
  const isSmall = size === "sm";

  return (
    <fieldset
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center gap-1 m-0 rounded-full bg-background/80 border border-neutral-700 dark:border-white/10 font-bold shrink-0",
        isSmall ? "p-0.5 text-[11px]" : "p-1 text-[10px]",
      )}
    >
      <button
        type="button"
        aria-pressed={isEssential}
        onClick={() => onChange("essential")}
        className={cn(
          "px-2.5 rounded-full flex items-center gap-1 whitespace-nowrap transition-colors cursor-pointer border outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
          isSmall ? "py-0.5" : "py-1",
          isEssential
            ? "bg-info/15 text-info border-info/35"
            : "text-neutral-400 hover:text-neutral-100 border-transparent",
        )}
      >
        {showIcons && <CoinIcon size={11} variant="credit" />}
        <span>{essentialLabel}</span>
      </button>

      <button
        type="button"
        aria-pressed={!isEssential}
        onClick={() => onChange("adventure")}
        className={cn(
          "px-2.5 rounded-full flex items-center gap-1 whitespace-nowrap transition-colors cursor-pointer border outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
          isSmall ? "py-0.5" : "py-1",
          !isEssential
            ? "bg-amber-500/15 text-gold-ink border-amber-500/40 dark:bg-gold/15 dark:text-gold dark:border-gold/30"
            : "text-neutral-400 hover:text-neutral-100 border-transparent",
        )}
      >
        {showIcons && <CoinIcon size={11} variant="coin" />}
        <span>{adventureLabel}</span>
      </button>
    </fieldset>
  );
}
