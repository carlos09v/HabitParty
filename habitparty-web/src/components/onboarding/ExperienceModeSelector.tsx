"use client";

import { CheckCircle2, Coins, ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { EXPERIENCE_MODES } from "@/constants/onboarding";
import type { ExperienceMode } from "@/types/ui";
import { cn } from "@/utils";
import { OnboardingSelectableCard } from "./OnboardingSelectableCard";

interface ExperienceModeSelectorProps {
  selectedMode: ExperienceMode;
  onSelect: (mode: ExperienceMode) => void;
}

export function ExperienceModeSelector({
  selectedMode,
  onSelect,
}: ExperienceModeSelectorProps) {
  const t = useTranslations("onboarding.experienceMode");
  const isGamified = selectedMode === "GAMIFIED";

  return (
    <fieldset className="flex flex-col gap-3 m-0 p-0 border-0">
      <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
        <legend className="text-body-s font-bold text-neutral-100">
          {t("sectionTitle")}
        </legend>
        <span className="text-tiny font-semibold text-amber-700 dark:text-gold">
          {t("switchHint")}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {EXPERIENCE_MODES.map((option) => {
          const isSelected = selectedMode === option.id;
          const highlights = t.raw(
            `options.${option.id}.highlights`,
          ) as string[];

          return (
            <OnboardingSelectableCard
              key={option.id}
              iconName={option.iconName}
              iconBadgeSize="lg"
              label={t(`options.${option.id}.label`)}
              description={t(`options.${option.id}.subtitle`)}
              selected={isSelected}
              onSelect={() => onSelect(option.id)}
            >
              <ul className="flex flex-col gap-1.5 mt-0.5 text-label-g text-neutral-200">
                {highlights.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2
                      size={13}
                      aria-hidden="true"
                      className={cn(
                        "shrink-0",
                        isSelected
                          ? "text-amber-700 dark:text-gold"
                          : "text-emerald-600 dark:text-emerald-400",
                      )}
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </OnboardingSelectableCard>
          );
        })}
      </div>

      {/* Live Mini-Preview adaptativo */}
      <div
        aria-live="polite"
        className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-surface/80 dark:bg-surface/50 border border-neutral-700/80 dark:border-primary/25 text-xs"
      >
        <div className="flex items-center gap-2 text-neutral-300">
          <span className="text-tiny font-bold uppercase tracking-wider text-neutral-400">
            {t("preview.label")}:
          </span>
          <span className="font-semibold text-neutral-100">
            {t("preview.sampleTask")}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/12 border border-amber-500/30 text-amber-800 dark:bg-gold/15 dark:border-gold/30 dark:text-gold font-bold">
            <Coins size={12} aria-hidden="true" />
            {isGamified
              ? t("preview.gamifiedReward")
              : t("preview.productivityReward")}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-300 font-semibold">
            <ShieldAlert size={12} aria-hidden="true" />
            {isGamified
              ? t("preview.gamifiedBadge")
              : t("preview.productivityBadge")}
          </span>
        </div>
      </div>
    </fieldset>
  );
}
