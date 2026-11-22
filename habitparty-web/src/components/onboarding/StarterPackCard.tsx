"use client";

import {
  CheckSquare,
  Gift,
  Kanban,
  Layers,
  type LucideIcon,
  ShieldAlert,
  Sparkles,
  Timer,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useId, useMemo } from "react";
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

interface StarterPackToggleItemProps {
  id: string;
  checked: boolean;
  onToggle: () => void;
  icon: LucideIcon;
  iconClassName: string;
  title: string;
  children: ReactNode;
}

function StarterPackToggleItem({
  id,
  checked,
  onToggle,
  icon: Icon,
  iconClassName,
  title,
  children,
}: StarterPackToggleItemProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex flex-col gap-1.5 p-3 min-h-[56px] rounded-xl border cursor-pointer transition-colors",
        checked
          ? "bg-surface/80 border-primary/45 dark:bg-surface/65 dark:border-primary/45"
          : "bg-surface/40 border-neutral-700/60 opacity-70",
      )}
    >
      <div className="flex items-center gap-2.5">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="w-4 h-4 accent-amber-500 rounded cursor-pointer shrink-0"
        />
        <Icon
          size={15}
          aria-hidden="true"
          className={cn("shrink-0", iconClassName)}
        />
        <span className="text-xs font-bold text-neutral-100">{title}</span>
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

  const plan = useMemo(
    () =>
      buildStarterPackPlan({
        usageMode,
        primaryGoals,
        mainObstacle,
        dailyFocusGoalMinutes,
        peakPeriod,
        disciplineStyle,
      }),
    [
      usageMode,
      primaryGoals,
      mainObstacle,
      dailyFocusGoalMinutes,
      peakPeriod,
      disciplineStyle,
    ],
  );

  const currencyLabel = isGamified
    ? t("currencyGamified")
    : t("currencyProductivity");

  const calibrationPills = [
    ...primaryGoals.map((goal) => tProfile(`goals.${goal}.label`)),
    tProfile(`obstacles.${mainObstacle}.label`),
    tRhythm(`peakOptions.${peakPeriod}.label`),
  ];

  const modeButtonClass = (active: boolean) =>
    cn(
      "flex items-center justify-center gap-2 px-4 py-2.5 min-h-[48px] rounded-xl border text-xs font-bold transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-gold",
      active
        ? "bg-amber-500/15 border-amber-500/80 text-amber-800 dark:bg-gold/15 dark:border-gold dark:text-gold"
        : "bg-surface/75 border-neutral-700 text-neutral-300 hover:text-neutral-100 dark:border-primary/25",
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

      {!startBlank && (
        <div className="flex flex-col gap-2.5 pt-1">
          {/* Resumo visual dos critérios aplicados ao Starter Pack */}
          <div className="flex flex-wrap items-center gap-1.5 px-2.5 py-2 rounded-lg bg-surface/65 border border-neutral-700/60 dark:border-primary/20 text-[11px]">
            <span className="inline-flex items-center gap-1 font-bold text-amber-700 dark:text-gold shrink-0">
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

          {/* 1. Colunas Kanban */}
          <StarterPackToggleItem
            id={`${baseId}-columns`}
            checked={selections.createColumns}
            onToggle={() => onToggleSelection("createColumns")}
            icon={Kanban}
            iconClassName="text-amber-700 dark:text-gold"
            title={t("toggles.columnsTitle")}
          >
            <div className="flex flex-wrap gap-1.5 pl-6">
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
            iconClassName="text-emerald-800 dark:text-emerald-400"
            title={t("toggles.tasksTitle", { count: plan.tasks.length })}
          >
            <ul className="flex flex-col gap-1 pl-6 text-[11px] text-neutral-300">
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
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-700 dark:text-rose-300 font-semibold">
                        <ShieldAlert size={10} aria-hidden="true" />
                        {isGamified ? t("badgeHardcore") : t("badgeStrict")}
                      </span>
                    )}
                    {showPriorityBadge && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-800 dark:bg-gold/15 dark:text-gold font-semibold">
                        {t("badgePriority")}
                      </span>
                    )}
                    {showLowFrictionBadge && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold">
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
              iconClassName="text-sky-700 dark:text-sky-400"
              title={t("toggles.focusTitle")}
            >
              <div className="flex items-center gap-2 pl-6 text-[11px] text-neutral-300">
                <span className="font-semibold text-neutral-100">
                  {t(`presets.focus.${plan.focusActivity.key}`)}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-700 dark:text-sky-300 font-semibold">
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
              iconClassName="text-amber-700 dark:text-gold"
              title={t("toggles.rewardsTitle", { count: plan.rewards.length })}
            >
              <div className="flex flex-col gap-0.5 pl-6 text-[11px] text-neutral-300">
                {plan.rewards.map((reward) => (
                  <span key={reward.key}>
                    • {t(`presets.rewards.${reward.key}`)} —{" "}
                    <strong className="text-amber-700 dark:text-gold">
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
