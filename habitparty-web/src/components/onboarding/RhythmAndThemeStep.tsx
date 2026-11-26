import { Volume2, VolumeX } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  DAILY_FOCUS_GOAL_OPTIONS,
  DISCIPLINE_STYLE_OPTIONS,
  ONBOARDING_FREE_THEMES,
  PEAK_PERIOD_OPTIONS,
} from "@/constants/onboarding";
import type {
  DailyFocusGoalMinutes,
  DisciplineStyle,
  PeakPeriod,
} from "@/types/onboarding";
import type { ExperienceMode, ThemeId } from "@/types/ui";
import { cn } from "@/utils";
import { OnboardingSelectableCard } from "./OnboardingSelectableCard";
import {
  ONBOARDING_CARD_IDLE,
  ONBOARDING_CARD_SELECTED,
  ONBOARDING_FOCUS_RING,
} from "./onboardingStyles";

interface RhythmAndThemeStepProps {
  experienceMode: ExperienceMode;
  dailyFocusGoalMinutes: DailyFocusGoalMinutes;
  onSelectFocusGoal: (minutes: DailyFocusGoalMinutes) => void;
  peakPeriod: PeakPeriod;
  onSelectPeakPeriod: (period: PeakPeriod) => void;
  disciplineStyle: DisciplineStyle;
  onSelectDiscipline: (style: DisciplineStyle) => void;
  selectedTheme: ThemeId;
  onSelectTheme: (theme: ThemeId) => void;
  uiSoundsEnabled: boolean;
  soundsMounted: boolean;
  onToggleUiSounds: () => void;
}

export function RhythmAndThemeStep({
  experienceMode,
  dailyFocusGoalMinutes,
  onSelectFocusGoal,
  peakPeriod,
  onSelectPeakPeriod,
  disciplineStyle,
  onSelectDiscipline,
  selectedTheme,
  onSelectTheme,
  uiSoundsEnabled,
  soundsMounted,
  onToggleUiSounds,
}: RhythmAndThemeStepProps) {
  const t = useTranslations("onboarding.rhythmAndTheme");
  const isGamified = experienceMode === "GAMIFIED";
  const resolvedSoundsEnabled = soundsMounted ? uiSoundsEnabled : true;

  return (
    <div className="flex flex-col gap-5">
      {/* Sub-bloco 1: Ritmo de Foco & Cobrança */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Meta Diária de Foco */}
        <fieldset className="flex flex-col gap-2 m-0 p-0 border-0">
          <legend className="text-body-s font-bold text-neutral-100 mb-1.5">
            {t("dailyFocusLegend")}
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {DAILY_FOCUS_GOAL_OPTIONS.map((opt) => (
              <OnboardingSelectableCard
                key={opt.id}
                variant="stacked"
                iconName={opt.iconName}
                label={t(`focusOptions.${opt.id}.label`)}
                description={t(`focusOptions.${opt.id}.hint`)}
                selected={dailyFocusGoalMinutes === opt.id}
                onSelect={() => onSelectFocusGoal(opt.id)}
              />
            ))}
          </div>
        </fieldset>

        {/* Período de Pico de Energia */}
        <fieldset className="flex flex-col gap-2 m-0 p-0 border-0">
          <legend className="text-body-s font-bold text-neutral-100 mb-1.5">
            {t("peakLegend")}
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {PEAK_PERIOD_OPTIONS.map((opt) => (
              <OnboardingSelectableCard
                key={opt.id}
                variant="chip"
                iconName={opt.iconName}
                label={t(`peakOptions.${opt.id}.label`)}
                selected={peakPeriod === opt.id}
                onSelect={() => onSelectPeakPeriod(opt.id)}
                className="min-h-[56px] p-3"
              />
            ))}
          </div>
        </fieldset>
      </div>

      {/* Estilo de Disciplina */}
      <fieldset className="flex flex-col gap-2 m-0 p-0 border-0">
        <legend className="text-body-s font-bold text-neutral-100 mb-1.5">
          {t("disciplineLegend")}
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {DISCIPLINE_STYLE_OPTIONS.map((opt) => {
            const desc =
              opt.id === "flexible"
                ? t("disciplineOptions.flexible.description")
                : isGamified
                  ? t("disciplineOptions.strict.descriptionGamified")
                  : t("disciplineOptions.strict.descriptionProductivity");

            return (
              <OnboardingSelectableCard
                key={opt.id}
                iconName={opt.iconName}
                label={t(`disciplineOptions.${opt.id}.label`)}
                description={desc}
                selected={disciplineStyle === opt.id}
                onSelect={() => onSelectDiscipline(opt.id)}
              />
            );
          })}
        </div>
      </fieldset>

      {/* Sub-bloco 2: Personalização Rápida (Visual & Áudio) */}
      <div className="pt-4 border-t border-neutral-700/60 dark:border-primary/20 flex flex-col gap-4">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
          {t("personalizationHeading")}
        </span>

        {/* Seletor Rápido de Tema Gratuito */}
        <fieldset className="flex flex-col gap-2 m-0 p-0 border-0">
          <legend className="text-body-s font-bold text-neutral-100 mb-1.5">
            {t("themeLegend")}
          </legend>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {ONBOARDING_FREE_THEMES.map((themeDef) => {
              const isSelected = selectedTheme === themeDef.id;
              return (
                <button
                  key={themeDef.id}
                  type="button"
                  onClick={() => onSelectTheme(themeDef.id)}
                  aria-pressed={isSelected}
                  className={cn(
                    "flex items-center justify-between gap-2 p-3 min-h-[48px] rounded-xl border text-left transition-colors cursor-pointer",
                    ONBOARDING_FOCUS_RING,
                    isSelected
                      ? ONBOARDING_CARD_SELECTED
                      : ONBOARDING_CARD_IDLE,
                  )}
                >
                  <span className="text-xs font-bold text-neutral-100 truncate">
                    {t(`themes.${themeDef.id}`)}
                  </span>
                  <span
                    aria-hidden="true"
                    className="flex items-center -space-x-1 shrink-0"
                  >
                    {(
                      [
                        themeDef.swatches.background,
                        themeDef.swatches.primary,
                        themeDef.swatches.gold,
                      ] as const
                    ).map((swatchColor, swatchIdx) => (
                      <span
                        key={`${themeDef.id}-swatch-${swatchIdx}`}
                        className="w-4 h-4 rounded-full border border-neutral-500/40 dark:border-white/25"
                        style={{ backgroundColor: swatchColor }}
                      />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Sons sutis de UI */}
        <button
          type="button"
          onClick={onToggleUiSounds}
          aria-pressed={resolvedSoundsEnabled}
          className={cn(
            "flex items-center justify-between gap-3 p-3.5 min-h-[56px] w-full rounded-xl border text-left transition-colors cursor-pointer",
            ONBOARDING_FOCUS_RING,
            resolvedSoundsEnabled
              ? "bg-success-500/10 border-success-500/45 dark:bg-success-500/15 dark:border-success-400/40"
              : ONBOARDING_CARD_IDLE,
          )}
        >
          <span className="flex items-center gap-2.5 min-w-0">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-surface border border-neutral-700 dark:border-primary/20 text-neutral-200 shrink-0">
              {resolvedSoundsEnabled ? (
                <Volume2
                  size={15}
                  aria-hidden="true"
                  className="text-success-400"
                />
              ) : (
                <VolumeX size={15} aria-hidden="true" />
              )}
            </span>
            <span className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-neutral-100 leading-tight">
                {t("soundEffectsLabel")}
              </span>
              <span className="text-[11px] text-neutral-300 leading-tight mt-0.5">
                {t("soundEffectsHint")}
              </span>
            </span>
          </span>

          <span
            className={cn(
              "px-2.5 py-1 rounded-md text-[11px] font-bold shrink-0 transition-opacity",
              !soundsMounted && "opacity-0",
              resolvedSoundsEnabled
                ? "bg-success-500/15 text-success-400"
                : "bg-surface text-neutral-400 border border-neutral-700/70",
            )}
          >
            {resolvedSoundsEnabled ? t("soundOn") : t("soundOff")}
          </span>
        </button>
      </div>
    </div>
  );
}
