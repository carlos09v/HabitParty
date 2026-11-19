"use client";

import {
  CheckCircle2,
  Clock,
  Flame,
  Layers,
  type LucideIcon,
  ShieldCheck,
  Sword,
  Target,
  Timer,
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { FOCUS_REWARD_RULES } from "@/constants/focus";
import { DIFFICULTY_REWARDS, HABIT_IMPORTANCE_REWARDS } from "@/constants/task";
import {
  calculateRankEffortBreakdown,
  type RankEffortBreakdown,
} from "@/utils";

type DailyPaceOption = "30" | "60" | "100" | "150";

const PACE_VALUES: readonly DailyPaceOption[] = ["30", "60", "100", "150"];

const PACE_XP_MAP: Record<DailyPaceOption, number> = {
  "30": 30,
  "60": 60,
  "100": 100,
  "150": 150,
};

interface EffortTileConfig {
  key: keyof Pick<
    RankEffortBreakdown,
    | "mediumTasks"
    | "hardTasks"
    | "normalHabits"
    | "standardPomodoros"
    | "deepWorkPomodoros"
  >;
  labelKey:
    | "mediumTasks"
    | "hardTasks"
    | "normalHabits"
    | "standardPomos"
    | "deepWorkPomos";
  icon: LucideIcon;
  essentialIcon?: LucideIcon;
  iconClassName: string;
  xpPerAction: number;
  fullWidth?: boolean;
}

const EFFORT_TILES: readonly EffortTileConfig[] = [
  {
    key: "mediumTasks",
    labelKey: "mediumTasks",
    icon: Sword,
    essentialIcon: Target,
    iconClassName: "text-warning-500 shrink-0",
    xpPerAction: DIFFICULTY_REWARDS.MEDIUM.xp,
  },
  {
    key: "hardTasks",
    labelKey: "hardTasks",
    icon: Sword,
    essentialIcon: Layers,
    iconClassName: "text-purple-400 shrink-0",
    xpPerAction: DIFFICULTY_REWARDS.HARD.xp,
  },
  {
    key: "normalHabits",
    labelKey: "normalHabits",
    icon: Flame,
    iconClassName: "text-emerald-500 shrink-0",
    xpPerAction: HABIT_IMPORTANCE_REWARDS.NORMAL.xp,
  },
  {
    key: "standardPomodoros",
    labelKey: "standardPomos",
    icon: Timer,
    iconClassName: "text-sky-400 shrink-0",
    xpPerAction: FOCUS_REWARD_RULES.STANDARD_XP_PER_CYCLE,
  },
  {
    key: "deepWorkPomodoros",
    labelKey: "deepWorkPomos",
    icon: Clock,
    iconClassName: "text-amber-700 dark:text-gold shrink-0",
    xpPerAction: FOCUS_REWARD_RULES.DEEP_WORK_XP_PER_CYCLE,
    fullWidth: true,
  },
] as const;

interface EffortSimulatorCardProps {
  remainingXp: number;
  isGamified?: boolean;
}

export function EffortSimulatorCard({
  remainingXp,
  isGamified = false,
}: EffortSimulatorCardProps) {
  const t = useTranslations("showcase.progression.simulator");
  const format = useFormatter();
  const [dailyPace, setDailyPace] = useState<DailyPaceOption>("60");

  const paceOptions = PACE_VALUES.map((value) => ({
    value,
    label: `${value} ${isGamified ? "XP" : "pts"}/d`,
  }));

  const effortBreakdown = calculateRankEffortBreakdown(
    remainingXp,
    PACE_XP_MAP[dailyPace],
  );

  return (
    <section className="rounded-2xl border border-neutral-700 dark:border-primary/30 bg-card dark:bg-surface/65 p-5 flex flex-col gap-3.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <ShieldCheck
            size={16}
            className="text-sky-600 dark:text-sky-300 shrink-0"
            aria-hidden="true"
          />
          <h3 className="text-sm font-black text-neutral-100 truncate">
            {t("title")}
          </h3>
        </div>
        <InfoTooltip
          title={t("infoTitle")}
          ariaLabel={t("infoTitle")}
          size={14}
        >
          <p className="text-xs text-neutral-300 leading-relaxed">
            {t(isGamified ? "infoDesc" : "infoDescEssential")}
          </p>
        </InfoTooltip>
      </div>

      {effortBreakdown.remainingXp === 0 ? (
        <div className="rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-3 py-2.5 flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 size={15} aria-hidden="true" />
          <span>{t("readyNow")}</span>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400 font-semibold">
                {t("paceLabel")}
              </span>
              <span className="font-bold text-amber-700 dark:text-gold tabular-nums">
                {t("daysEstimate", {
                  days: effortBreakdown.estimatedDaysAtPace,
                })}
              </span>
            </div>
            <SegmentedControl
              ariaLabel={t("paceLabel")}
              options={paceOptions}
              value={dailyPace}
              onChange={setDailyPace}
              size="sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {EFFORT_TILES.map((tile) => {
              const Icon = isGamified
                ? tile.icon
                : (tile.essentialIcon ?? tile.icon);
              const formattedCount = format.number(effortBreakdown[tile.key]);
              const xpHint = t(isGamified ? "xpPerAction" : "ptsPerAction", {
                xp: tile.xpPerAction,
              });

              if (tile.fullWidth) {
                return (
                  <div
                    key={tile.key}
                    className="col-span-2 rounded-xl border border-neutral-700/70 dark:border-white/10 bg-surface/60 p-2.5 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon
                        size={14}
                        className={tile.iconClassName}
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-neutral-200 truncate">
                          {t(tile.labelKey)}
                        </p>
                        <span className="text-[10px] text-neutral-400">
                          {xpHint}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-black text-neutral-100 tabular-nums shrink-0">
                      {formattedCount}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={tile.key}
                  className="rounded-xl border border-neutral-700/70 dark:border-white/10 bg-surface/60 p-2.5"
                >
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-400">
                    <Icon
                      size={12}
                      className={tile.iconClassName}
                      aria-hidden="true"
                    />
                    <span className="truncate">{t(tile.labelKey)}</span>
                  </div>
                  <p className="text-sm font-black text-neutral-100 mt-1 tabular-nums">
                    {formattedCount}
                  </p>
                  <span className="text-[10px] text-neutral-400">{xpHint}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
