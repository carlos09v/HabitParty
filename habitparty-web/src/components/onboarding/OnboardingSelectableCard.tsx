import type { ReactNode } from "react";
import { ONBOARDING_ICON_MAP } from "@/constants/onboardingIcons";
import type { OnboardingIconKey } from "@/types/onboarding";
import { cn } from "@/utils/cn";
import {
  ONBOARDING_CARD_IDLE,
  ONBOARDING_CARD_MUTED,
  ONBOARDING_CARD_SELECTED,
  ONBOARDING_CHIP_IDLE,
  ONBOARDING_CHIP_SELECTED,
  ONBOARDING_FOCUS_RING,
} from "./onboardingStyles";

export { ONBOARDING_ICON_MAP };

interface OnboardingSelectableCardProps {
  iconName: OnboardingIconKey;
  label: string;
  description?: string;
  selected: boolean;
  onSelect: () => void;
  variant?: "card" | "stacked" | "chip";
  iconBadgeSize?: "md" | "lg";
  dimmed?: boolean;
  className?: string;
  children?: ReactNode;
}

export function OnboardingSelectableCard({
  iconName,
  label,
  description,
  selected,
  onSelect,
  variant = "card",
  iconBadgeSize = "md",
  dimmed = false,
  className,
  children,
}: OnboardingSelectableCardProps) {
  const IconComponent =
    ONBOARDING_ICON_MAP[iconName] ?? ONBOARDING_ICON_MAP.Target;

  if (variant === "chip") {
    return (
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className={cn(
          "flex items-center justify-center gap-2 px-3 py-2.5 min-h-[48px] rounded-xl border text-xs font-bold transition-[background-color,border-color,color] duration-150 cursor-pointer",
          ONBOARDING_FOCUS_RING,
          selected ? ONBOARDING_CHIP_SELECTED : ONBOARDING_CHIP_IDLE,
          className,
        )}
      >
        <IconComponent size={15} aria-hidden="true" className="shrink-0" />
        <span>{label}</span>
      </button>
    );
  }

  if (variant === "stacked") {
    return (
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className={cn(
          "flex flex-col items-start gap-1 p-3 min-h-[56px] rounded-xl border text-left transition-[background-color,border-color,box-shadow] duration-150 cursor-pointer",
          ONBOARDING_FOCUS_RING,
          selected ? ONBOARDING_CARD_SELECTED : ONBOARDING_CARD_IDLE,
          className,
        )}
      >
        <span className="flex items-center gap-1.5 text-xs font-bold text-neutral-100">
          <IconComponent
            size={14}
            aria-hidden="true"
            className={cn(
              "shrink-0",
              selected ? "text-gold-ink dark:text-gold" : "text-neutral-300",
            )}
          />
          <span>{label}</span>
        </span>
        {description && (
          <span className="text-[11px] text-neutral-300 leading-tight">
            {description}
          </span>
        )}
      </button>
    );
  }

  const isLarge = iconBadgeSize === "lg";

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex flex-col gap-2.5 min-h-[56px] rounded-xl border text-left transition-[background-color,border-color,box-shadow] duration-150 cursor-pointer",
        ONBOARDING_FOCUS_RING,
        isLarge ? "p-3.5 sm:p-4" : "p-3",
        selected
          ? ONBOARDING_CARD_SELECTED
          : dimmed
            ? ONBOARDING_CARD_MUTED
            : ONBOARDING_CARD_IDLE,
        className,
      )}
    >
      <div className="flex items-center gap-2.5 w-full">
        <span
          className={cn(
            "flex items-center justify-center rounded-lg border shrink-0 transition-colors",
            isLarge ? "w-9 h-9" : "w-8 h-8",
            selected
              ? "bg-amber-500/15 text-gold-ink border-amber-500/35 dark:bg-gold/15 dark:text-gold dark:border-gold/35"
              : "bg-surface text-neutral-300 border-neutral-700 dark:bg-surface/80 dark:border-primary/20",
          )}
        >
          <IconComponent size={isLarge ? 17 : 15} aria-hidden="true" />
        </span>

        <span className="flex flex-col min-w-0">
          <span
            className={cn(
              "font-bold leading-tight",
              dimmed && !selected ? "text-neutral-300" : "text-neutral-100",
              isLarge ? "text-body-s" : "text-xs",
            )}
          >
            {label}
          </span>
          {description && (
            <span
              className={cn(
                "leading-snug mt-0.5",
                dimmed && !selected ? "text-neutral-400" : "text-neutral-300",
                isLarge ? "text-label-g" : "text-[11px]",
              )}
            >
              {description}
            </span>
          )}
        </span>
      </div>

      {children}
    </button>
  );
}
