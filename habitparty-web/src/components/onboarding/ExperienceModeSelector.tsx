import { CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { ExperienceModeMiniPreview } from "@/components/ui/ExperienceModeMiniPreview";
import { EXPERIENCE_MODES } from "@/constants/onboarding";
import type { ExperienceMode } from "@/types/ui";
import { cn } from "@/utils/cn";
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
      <legend className="sr-only">{t("sectionTitle")}</legend>
      <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
        <span
          aria-hidden="true"
          className="text-body-s font-bold text-neutral-100"
        >
          {t("sectionTitle")}
        </span>
        <span className="text-tiny font-semibold text-gold-ink dark:text-gold">
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
                          ? "text-gold-ink dark:text-gold"
                          : "text-success-400",
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
      <ExperienceModeMiniPreview
        isGamified={isGamified}
        label={t("preview.label")}
        sampleTask={t("preview.sampleTask")}
        rewardText={
          isGamified
            ? t("preview.gamifiedReward")
            : t("preview.productivityReward")
        }
        badgeText={
          isGamified
            ? t("preview.gamifiedBadge")
            : t("preview.productivityBadge")
        }
        className="px-3.5 py-2.5 bg-surface/80 dark:bg-surface/50 dark:border-primary/25"
      />
    </fieldset>
  );
}
