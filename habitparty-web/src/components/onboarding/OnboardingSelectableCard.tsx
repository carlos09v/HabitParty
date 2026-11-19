"use client";

import {
  BatteryLow,
  Brain,
  Briefcase,
  CalendarCheck,
  Clock,
  Coffee,
  Compass,
  Flame,
  GraduationCap,
  Kanban,
  type LucideIcon,
  Moon,
  Repeat,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sun,
  Target,
  Timer,
  User,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";
import type { OnboardingIconKey } from "@/types/onboarding";
import { cn } from "@/utils";

export const ONBOARDING_ICON_MAP: Record<OnboardingIconKey, LucideIcon> = {
  Target,
  Sparkles,
  User,
  GraduationCap,
  Briefcase,
  Timer,
  Flame,
  Kanban,
  CalendarCheck,
  Coffee,
  Clock,
  Smartphone,
  Repeat,
  BatteryLow,
  Zap,
  Brain,
  Sun,
  Compass,
  Moon,
  ShieldCheck,
};

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
  const IconComponent = ONBOARDING_ICON_MAP[iconName] ?? Target;

  if (variant === "chip") {
    return (
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className={cn(
          "flex items-center justify-center gap-2 px-3 py-2.5 min-h-[48px] rounded-xl border text-xs font-bold transition-[background-color,border-color,color] duration-150 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-gold",
          selected
            ? "bg-amber-500/15 border-amber-500/80 text-amber-800 dark:bg-gold/15 dark:border-gold dark:text-gold"
            : "bg-card/80 border-neutral-700/80 text-neutral-200 hover:border-primary/50 hover:bg-surface/70 dark:bg-surface/55 dark:border-primary/25 dark:hover:border-primary/50",
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
          "flex flex-col items-start gap-1 p-3 min-h-[56px] rounded-xl border text-left transition-[background-color,border-color,box-shadow] duration-150 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-gold",
          selected
            ? "bg-primary/15 border-amber-500/80 dark:bg-primary/25 dark:border-gold shadow-xs dark:shadow-glow-gold-xs"
            : "bg-card/80 border-neutral-700/80 hover:border-primary/50 hover:bg-surface/70 dark:bg-surface/55 dark:border-primary/25 dark:hover:border-primary/50",
          className,
        )}
      >
        <span className="flex items-center gap-1.5 text-xs font-bold text-neutral-100">
          <IconComponent
            size={14}
            aria-hidden="true"
            className={cn(
              "shrink-0",
              selected ? "text-amber-700 dark:text-gold" : "text-neutral-300",
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
        "flex flex-col gap-2.5 min-h-[56px] rounded-xl border text-left transition-[background-color,border-color,box-shadow,opacity] duration-150 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-gold",
        isLarge ? "p-3.5 sm:p-4" : "p-3",
        selected
          ? "bg-primary/15 border-amber-500/80 dark:bg-primary/25 dark:border-gold shadow-xs dark:shadow-glow-gold-xs"
          : dimmed
            ? "bg-card/50 border-neutral-700/50 opacity-60 hover:opacity-85"
            : "bg-card/85 border-neutral-700/80 hover:border-primary/50 hover:bg-surface/70 dark:bg-surface/55 dark:border-primary/25 dark:hover:border-primary/50",
        className,
      )}
    >
      <div className="flex items-center gap-2.5 w-full">
        <span
          className={cn(
            "flex items-center justify-center rounded-lg border shrink-0 transition-colors",
            isLarge ? "w-9 h-9" : "w-8 h-8",
            selected
              ? "bg-amber-500/15 text-amber-700 border-amber-500/35 dark:bg-gold/15 dark:text-gold dark:border-gold/35"
              : "bg-surface text-neutral-300 border-neutral-700 dark:bg-surface/80 dark:border-primary/20",
          )}
        >
          <IconComponent size={isLarge ? 17 : 15} aria-hidden="true" />
        </span>

        <span className="flex flex-col min-w-0">
          <span
            className={cn(
              "font-bold text-neutral-100 leading-tight",
              isLarge ? "text-body-s" : "text-xs",
            )}
          >
            {label}
          </span>
          {description && (
            <span
              className={cn(
                "text-neutral-300 leading-snug mt-0.5",
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
