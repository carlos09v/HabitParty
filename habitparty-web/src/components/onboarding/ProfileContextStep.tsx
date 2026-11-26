import { useTranslations } from "next-intl";
import {
  MAIN_OBSTACLE_OPTIONS,
  MAX_PRIMARY_GOALS,
  PRIMARY_GOAL_OPTIONS,
} from "@/constants/onboarding";
import type { MainObstacle, PrimaryGoal } from "@/types/onboarding";
import { OnboardingSelectableCard } from "./OnboardingSelectableCard";

interface ProfileContextStepProps {
  primaryGoals: PrimaryGoal[];
  onToggleGoal: (goal: PrimaryGoal) => void;
  mainObstacle: MainObstacle;
  onSelectObstacle: (obstacle: MainObstacle) => void;
  goalsError?: string | null;
}

export function ProfileContextStep({
  primaryGoals,
  onToggleGoal,
  mainObstacle,
  onSelectObstacle,
  goalsError,
}: ProfileContextStepProps) {
  const t = useTranslations("onboarding.profileContext");
  const isAtMaxGoals = primaryGoals.length >= MAX_PRIMARY_GOALS;

  return (
    <div className="flex flex-col gap-5">
      {/* Objetivos Principais (até 2 escolhas) */}
      <fieldset className="flex flex-col gap-2.5 m-0 p-0 border-0">
        <legend className="sr-only">
          {t("goalsLegend", {
            count: primaryGoals.length,
            max: MAX_PRIMARY_GOALS,
          })}
        </legend>
        <div className="flex items-baseline justify-between gap-2 flex-wrap mb-1">
          <span
            aria-hidden="true"
            className="text-body-s font-bold text-neutral-100"
          >
            {t("goalsLegend", {
              count: primaryGoals.length,
              max: MAX_PRIMARY_GOALS,
            })}
          </span>
          <span
            className={
              isAtMaxGoals
                ? "text-xs font-medium text-gold-ink dark:text-gold"
                : "text-xs text-neutral-300"
            }
          >
            {isAtMaxGoals ? t("maxGoalsReplaceHint") : t("goalsHint")}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {PRIMARY_GOAL_OPTIONS.map((goal) => {
            const isSelected = primaryGoals.includes(goal.id);
            const isMaxReached = !isSelected && isAtMaxGoals;

            return (
              <OnboardingSelectableCard
                key={goal.id}
                iconName={goal.iconName}
                label={t(`goals.${goal.id}.label`)}
                description={t(`goals.${goal.id}.description`)}
                selected={isSelected}
                dimmed={isMaxReached}
                onSelect={() => onToggleGoal(goal.id)}
              />
            );
          })}
        </div>

        {goalsError && (
          <p role="alert" className="text-xs font-semibold text-danger-400">
            {goalsError}
          </p>
        )}
      </fieldset>

      {/* Principal Obstáculo */}
      <fieldset className="flex flex-col gap-2.5 m-0 p-0 border-0">
        <legend className="text-body-s font-bold text-neutral-100 mb-1">
          {t("obstacleLegend")}
        </legend>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {MAIN_OBSTACLE_OPTIONS.map((obstacle) => (
            <OnboardingSelectableCard
              key={obstacle.id}
              variant="chip"
              iconName={obstacle.iconName}
              label={t(`obstacles.${obstacle.id}.label`)}
              selected={mainObstacle === obstacle.id}
              onSelect={() => onSelectObstacle(obstacle.id)}
            />
          ))}
        </div>
      </fieldset>
    </div>
  );
}
