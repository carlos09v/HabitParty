import {
  CheckSquare,
  Gift,
  Info,
  Kanban,
  Layers,
  type LucideIcon,
  ShieldAlert,
  Sparkles,
  Timer,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useId } from "react";
import { buildStarterPackPlan } from "@/constants/onboarding";
import type {
  DailyFocusGoalMinutes,
  DisciplineStyle,
  MainObstacle,
  PeakPeriod,
  PrimaryGoal,
  StarterPackSelections,
  UsageMode,
} from "@/types/onboarding";
import type { ExperienceMode } from "@/types/ui";
import { cn } from "@/utils";
import {
  ONBOARDING_CHIP_IDLE,
  ONBOARDING_CHIP_SELECTED,
  ONBOARDING_FOCUS_RING,
} from "./onboardingStyles";

interface StarterPackToggleItemProps {
  id: string;
  checked: boolean;
  onToggle: () => void;
  icon: LucideIcon;
  iconClassName: string;
  title: string;
  helperNote?: string;
  children: ReactNode;
}

function StarterPackToggleItem({
  id,
  checked,
  onToggle,
  icon: Icon,
  iconClassName,
  title,
  helperNote,
  children,
}: StarterPackToggleItemProps) {
  return (
    <label
      className={cn(
        "flex flex-col gap-1.5 p-3 min-h-[56px] rounded-xl border cursor-pointer transition-colors",
        checked
          ? "bg-surface/80 border-primary/45 dark:bg-surface/65 dark:border-primary/45"
          : "bg-surface/40 border-neutral-700/60 hover:border-primary/40",
      )}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2.5">
          <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={onToggle}
            className="checkbox-custom cursor-pointer shrink-0"
          />
          <Icon
            size={15}
            aria-hidden="true"
            className={cn("shrink-0", iconClassName)}
          />
          <span
            className={cn(
              "text-xs font-bold",
              checked ? "text-neutral-100" : "text-neutral-300",
            )}
          >
            {title}
          </span>
        </div>
        {helperNote && (
          <span className="text-[11px] font-medium text-neutral-400 pl-7 sm:pl-0">
            {helperNote}
          </span>
        )}
      </div>
      {children}
    </label>
  );
}

interface StarterPackCardProps {
  usageMode: UsageMode;
  primaryGoals: PrimaryGoal[];
  mainObstacle: MainObstacle;
  experienceMode: ExperienceMode;
  dailyFocusGoalMinutes: DailyFocusGoalMinutes;
  peakPeriod: PeakPeriod;
  disciplineStyle: DisciplineStyle;
  startBlank: boolean;
  onChangeStartBlank: (blank: boolean) => void;
  selections: StarterPackSelections;
  onToggleSelection: (key: keyof StarterPackSelections) => void;
}

export function StarterPackCard({
  usageMode,
  primaryGoals,
  mainObstacle,
  experienceMode,
  dailyFocusGoalMinutes,
  peakPeriod,
  disciplineStyle,
  startBlank,
  onChangeStartBlank,
  selections,
  onToggleSelection,
}: StarterPackCardProps) {
  const t = useTranslations("onboarding.starterPack");
  const tProfile = useTranslations("onboarding.profileContext");
  const tRhythm = useTranslations("onboarding.rhythmAndTheme");
  const baseId = useId();
  const isGamified = experienceMode === "GAMIFIED";

  const plan = buildStarterPackPlan({
    usageMode,
    primaryGoals,
    mainObstacle,
    dailyFocusGoalMinutes,
    peakPeriod,
    disciplineStyle,
  });

  const currencyLabel = isGamified
    ? t("currencyGamified")
    : t("currencyProductivity");

  const calibrationPills = [
    ...primaryGoals.map((goal) => tProfile(`goals.${goal}.label`)),
    tProfile(`obstacles.${mainObstacle}.label`),
    tRhythm(`peakOptions.${peakPeriod}.label`),
  ];

  const hasAnySelected = Object.values(selections).some(Boolean);

  const modeButtonClass = (active: boolean) =>
    cn(
      "flex items-center justify-center gap-2 px-4 py-2.5 min-h-[48px] rounded-xl border text-xs font-bold transition-colors cursor-pointer",
      ONBOARDING_FOCUS_RING,
      active ? ONBOARDING_CHIP_SELECTED : ONBOARDING_CHIP_IDLE,
    );

  return (
    <fieldset className="flex flex-col gap-3 rounded-xl border border-neutral-700/80 dark:border-primary/25 bg-card/80 dark:bg-surface/45 p-4 m-0">
      <legend className="text-body-s font-bold text-neutral-100 px-1">
        {t("legend")}
      </legend>

      {/* Alternância: Recomendado vs Quadro em Branco */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => onChangeStartBlank(false)}
          aria-pressed={!startBlank}
          className={modeButtonClass(!startBlank)}
        >
          <Layers size={15} aria-hidden="true" />
          <span>{t("modeRecommended")}</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeStartBlank(true)}
          aria-pressed={startBlank}
          className={modeButtonClass(startBlank)}
        >
          <span>{t("modeBlank")}</span>
        </button>
      </div>

      {startBlank ? (
        <div
          aria-live="polite"
          className="flex items-start gap-2.5 p-3.5 rounded-xl bg-surface/65 border border-neutral-700/70 dark:border-primary/20 text-xs text-neutral-300"
        >
          <Info
            size={16}
            aria-hidden="true"
            className="text-info shrink-0 mt-0.5"
          />
          <div className="flex flex-col gap-0.5">
            <span className="font-bold text-neutral-100">
              {t("blankStateTitle")}
            </span>
            <p className="leading-relaxed">{t("blankStateNote")}</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 pt-1">
          {/* Resumo visual dos critérios aplicados ao Starter Pack */}
          <div className="flex flex-wrap items-center gap-1.5 px-2.5 py-2 rounded-lg bg-surface/65 border border-neutral-700/60 dark:border-primary/20 text-[11px]">
            <span className="inline-flex items-center gap-1 font-bold text-gold-ink dark:text-gold shrink-0">
              <Sparkles size={12} aria-hidden="true" />
              {t("calibratedPrefix")}
            </span>
            {calibrationPills.map((pill) => (
              <span
                key={pill}
                className="px-2 py-0.5 rounded-md bg-card border border-neutral-700/70 dark:border-primary/25 text-neutral-200 font-medium"
              >
                {pill}
              </span>
            ))}
          </div>

          {!hasAnySelected && (
            <div
              aria-live="polite"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface/60 border border-neutral-700/70 text-xs text-neutral-300"
            >
              <Info
                size={14}
                aria-hidden="true"
                className="text-info shrink-0"
              />
              <span>{t("allUncheckedNotice")}</span>
            </div>
          )}

          {/* 1. Colunas Kanban */}
          <StarterPackToggleItem
            id={`${baseId}-columns`}
            checked={selections.createColumns}
            onToggle={() => onToggleSelection("createColumns")}
            icon={Kanban}
            iconClassName="text-gold-ink dark:text-gold"
            title={t("toggles.columnsTitle")}
          >
            <div className="flex flex-wrap gap-1.5 pl-7">
              {plan.columns.map((col) => (
                <span
                  key={col.key}
                  className="px-2 py-0.5 rounded-md bg-card border border-neutral-700/70 dark:border-primary/25 text-[11px] font-medium text-neutral-200"
                >
                  {t(`presets.columns.${col.key}`)}
                </span>
              ))}
            </div>
          </StarterPackToggleItem>

          {/* 2. Tarefas Iniciais */}
          <StarterPackToggleItem
            id={`${baseId}-tasks`}
            checked={selections.createTasks}
            onToggle={() => onToggleSelection("createTasks")}
            icon={CheckSquare}
            iconClassName="text-success-400"
            title={t("toggles.tasksTitle", { count: plan.tasks.length })}
            helperNote={
              !selections.createColumns
                ? t("tasksRequireColumnsHint")
                : undefined
            }
          >
            <ul className="flex flex-col gap-1 pl-7 text-[11px] text-neutral-300">
              {plan.tasks.map((task) => {
                const showHardcoreBadge =
                  task.isHardcoreIfStrict && disciplineStyle === "strict";
                const showLowFrictionBadge =
                  task.taskType !== "HABIT" &&
                  task.difficulty === "EASY" &&
                  (mainObstacle === "procrastination" ||
                    mainObstacle === "burnout");
                const showPriorityBadge = task.priority === "HIGH";

                return (
                  <li
                    key={task.key}
                    className="flex flex-wrap items-center gap-1.5"
                  >
                    <span>• {t(`presets.tasks.${task.key}`)}</span>
                    {showHardcoreBadge && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-danger-500/12 text-danger-400 dark:text-danger-300 font-semibold">
                        <ShieldAlert size={10} aria-hidden="true" />
                        {isGamified ? t("badgeHardcore") : t("badgeStrict")}
                      </span>
                    )}
                    {showPriorityBadge && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-gold-ink dark:bg-gold/15 dark:text-gold font-semibold">
                        {t("badgePriority")}
                      </span>
                    )}
                    {showLowFrictionBadge && (
                      <span className="px-1.5 py-0.5 rounded bg-success-500/15 text-success-400 font-semibold">
                        {t("badgeLowFriction")}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </StarterPackToggleItem>

          {/* 3. Atividade de Foco + 4. Recompensas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <StarterPackToggleItem
              id={`${baseId}-focus`}
              checked={selections.createFocusActivity}
              onToggle={() => onToggleSelection("createFocusActivity")}
              icon={Timer}
              iconClassName="text-info"
              title={t("toggles.focusTitle")}
            >
              <div className="flex items-center flex-wrap gap-2 pl-7 text-[11px] text-neutral-300">
                <span className="font-semibold text-neutral-100">
                  {t(`presets.focus.${plan.focusActivity.key}`)}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-info/15 text-info font-semibold">
                  {t("badgeDailyFocus", {
                    minutes: plan.focusActivity.targetTimeMinutes,
                  })}
                </span>
              </div>
            </StarterPackToggleItem>

            <StarterPackToggleItem
              id={`${baseId}-rewards`}
              checked={selections.createRewards}
              onToggle={() => onToggleSelection("createRewards")}
              icon={Gift}
              iconClassName="text-gold-ink dark:text-gold"
              title={t("toggles.rewardsTitle", { count: plan.rewards.length })}
            >
              <div className="flex flex-col gap-0.5 pl-7 text-[11px] text-neutral-300">
                {plan.rewards.map((reward) => (
                  <span key={reward.key}>
                    • {t(`presets.rewards.${reward.key}`)} —{" "}
                    <strong className="text-gold-ink dark:text-gold">
                      {reward.price} {currencyLabel}
                    </strong>
                  </span>
                ))}
                <span className="text-[10px] text-neutral-400 mt-0.5">
                  {t("ratioHint")}
                </span>
              </div>
            </StarterPackToggleItem>
          </div>
        </div>
      )}
    </fieldset>
  );
}
