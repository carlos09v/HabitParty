"use client";

import { useTranslations } from "next-intl";
import { useMemo, useTransition } from "react";
import { toast } from "sonner";
import { updateUserProfileAction } from "@/actions/userActions";
import { useRegisterSettingsDirty } from "@/components/settings/SettingsDirtyContext";
import { SettingsOptionGrid } from "@/components/settings/SettingsOptionGrid";
import { SettingsSaveButton } from "@/components/settings/SettingsSaveButton";
import {
  DAILY_FOCUS_GOAL_OPTIONS,
  DISCIPLINE_STYLE_OPTIONS,
  MAIN_OBSTACLE_OPTIONS,
  MAX_PRIMARY_GOALS,
  PEAK_PERIOD_OPTIONS,
  PRIMARY_GOAL_OPTIONS,
  resolveInitialDailyFocusGoal,
  resolveInitialDisciplineStyle,
  resolveInitialMainObstacle,
  resolveInitialPeakPeriod,
  resolveInitialPrimaryGoals,
  resolveInitialUsageMode,
  USAGE_MODES,
} from "@/constants/onboarding";
import { ONBOARDING_ICON_MAP } from "@/constants/onboardingIcons";
import { useResolvedUser } from "@/hooks/useResolvedUser";
import { useSyncedSettingsForm } from "@/hooks/useSyncedSettingsForm";
import { useUserStore } from "@/store/userStore";
import type {
  DailyFocusGoalMinutes,
  DisciplineStyle,
  MainObstacle,
  PeakPeriod,
  PrimaryGoal,
  UsageMode,
} from "@/types/onboarding";
import type { UserResponseDTO } from "@/types/user";
import { cn } from "@/utils/cn";

interface RoutinePreferencesCardProps {
  initialUser: UserResponseDTO | null;
}

interface RoutineFormValues extends Record<string, unknown> {
  dailyGoal: DailyFocusGoalMinutes;
  peakPeriod: PeakPeriod;
  disciplineStyle: DisciplineStyle;
  usageMode: UsageMode;
  primaryGoals: PrimaryGoal[];
  mainObstacle: MainObstacle;
}

function arePrimaryGoalsEqual(a: PrimaryGoal[], b: PrimaryGoal[]): boolean {
  return a.length === b.length && a.every((g) => b.includes(g));
}

export function RoutinePreferencesCard({
  initialUser,
}: RoutinePreferencesCardProps) {
  const t = useTranslations("settings.routineCard");
  const updateUserPartial = useUserStore((s) => s.updateUserPartial);
  const resolvedUser = useResolvedUser(initialUser);

  const userId = resolvedUser?.id;
  const savedDailyGoal = resolveInitialDailyFocusGoal(
    resolvedUser?.dailyFocusGoalMinutes,
  );
  const savedPeakPeriod = resolveInitialPeakPeriod(resolvedUser?.peakPeriod);
  const savedDiscipline = resolveInitialDisciplineStyle(
    resolvedUser?.disciplineStyle,
  );
  const savedUsageMode = resolveInitialUsageMode(resolvedUser?.usageMode);
  const savedPrimaryGoals = useMemo(
    () => resolveInitialPrimaryGoals(resolvedUser?.primaryGoals),
    [resolvedUser?.primaryGoals],
  );
  const savedObstacle = resolveInitialMainObstacle(resolvedUser?.mainObstacle);

  const persisted = useMemo<RoutineFormValues>(
    () => ({
      dailyGoal: savedDailyGoal,
      peakPeriod: savedPeakPeriod,
      disciplineStyle: savedDiscipline,
      usageMode: savedUsageMode,
      primaryGoals: savedPrimaryGoals,
      mainObstacle: savedObstacle,
    }),
    [
      savedDailyGoal,
      savedPeakPeriod,
      savedDiscipline,
      savedUsageMode,
      savedPrimaryGoals,
      savedObstacle,
    ],
  );

  const { values, setField, markSaved } = useSyncedSettingsForm(persisted, {
    resetKey: userId,
  });
  const {
    dailyGoal,
    peakPeriod,
    disciplineStyle,
    usageMode,
    primaryGoals,
    mainObstacle,
  } = values;
  const [isPending, startTransition] = useTransition();

  const hasChanges =
    dailyGoal !== savedDailyGoal ||
    peakPeriod !== savedPeakPeriod ||
    disciplineStyle !== savedDiscipline ||
    usageMode !== savedUsageMode ||
    mainObstacle !== savedObstacle ||
    !arePrimaryGoalsEqual(primaryGoals, savedPrimaryGoals);

  useRegisterSettingsDirty("routine-preferences", hasChanges);

  const handleToggleGoal = (goalId: PrimaryGoal) => {
    if (primaryGoals.includes(goalId) && primaryGoals.length === 1) {
      toast.info(t("minGoalsHint"));
      return;
    }
    if (primaryGoals.includes(goalId)) {
      setField(
        "primaryGoals",
        primaryGoals.filter((g) => g !== goalId),
      );
      return;
    }
    if (primaryGoals.length >= MAX_PRIMARY_GOALS) {
      setField("primaryGoals", [...primaryGoals.slice(1), goalId]);
      return;
    }
    setField("primaryGoals", [...primaryGoals, goalId]);
  };

  const handleSave = () => {
    if (isPending || !hasChanges) return;
    const submitted: RoutineFormValues = {
      dailyGoal,
      peakPeriod,
      disciplineStyle,
      usageMode,
      primaryGoals: [...primaryGoals],
      mainObstacle,
    };
    startTransition(async () => {
      const res = await updateUserProfileAction({
        dailyFocusGoalMinutes: submitted.dailyGoal,
        peakPeriod: submitted.peakPeriod,
        disciplineStyle: submitted.disciplineStyle,
        usageMode: submitted.usageMode,
        primaryGoals: submitted.primaryGoals,
        mainObstacle: submitted.mainObstacle,
      });
      if (!res.success) {
        toast.error(res.error || t("saveError"));
        return;
      }
      markSaved(submitted, {
        dailyGoal: resolveInitialDailyFocusGoal(
          res.data?.dailyFocusGoalMinutes ?? submitted.dailyGoal,
        ),
        peakPeriod: resolveInitialPeakPeriod(
          res.data?.peakPeriod ?? submitted.peakPeriod,
        ),
        disciplineStyle: resolveInitialDisciplineStyle(
          res.data?.disciplineStyle ?? submitted.disciplineStyle,
        ),
        usageMode: resolveInitialUsageMode(
          res.data?.usageMode ?? submitted.usageMode,
        ),
        primaryGoals: resolveInitialPrimaryGoals(
          res.data?.primaryGoals ?? submitted.primaryGoals,
        ),
        mainObstacle: resolveInitialMainObstacle(
          res.data?.mainObstacle ?? submitted.mainObstacle,
        ),
      });
      if (res.data) {
        updateUserPartial(res.data);
      } else {
        updateUserPartial({
          dailyFocusGoalMinutes: submitted.dailyGoal,
          peakPeriod: submitted.peakPeriod,
          disciplineStyle: submitted.disciplineStyle,
          usageMode: submitted.usageMode,
          primaryGoals: submitted.primaryGoals,
          mainObstacle: submitted.mainObstacle,
        });
      }
      toast.success(t("saveSuccess"));
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <SettingsOptionGrid
        variant="compact"
        labelId="routine-daily-focus-goal"
        title={t("dailyFocusGoalTitle")}
        description={t("dailyFocusGoalDesc")}
        selectedValue={String(dailyGoal)}
        options={DAILY_FOCUS_GOAL_OPTIONS.map((opt) => ({
          value: String(opt.id),
          icon: ONBOARDING_ICON_MAP[opt.iconName],
          title: t(`focusGoals.${opt.id}.label`),
          description: t(`focusGoals.${opt.id}.desc`),
        }))}
        onSelect={(val) =>
          setField("dailyGoal", Number(val) as DailyFocusGoalMinutes)
        }
        disabled={isPending}
      />

      <SettingsOptionGrid
        variant="compact"
        labelId="routine-peak-period"
        title={t("peakPeriodTitle")}
        description={t("peakPeriodDesc")}
        selectedValue={peakPeriod}
        options={PEAK_PERIOD_OPTIONS.map((opt) => ({
          value: opt.id,
          icon: ONBOARDING_ICON_MAP[opt.iconName],
          title: t(`peakPeriods.${opt.id}.label`),
          description: t(`peakPeriods.${opt.id}.desc`),
        }))}
        onSelect={(val) => setField("peakPeriod", val)}
        disabled={isPending}
      />

      <SettingsOptionGrid
        variant="compact"
        labelId="routine-discipline-style"
        title={t("disciplineStyleTitle")}
        description={t("disciplineStyleDesc")}
        selectedValue={disciplineStyle}
        options={DISCIPLINE_STYLE_OPTIONS.map((opt) => ({
          value: opt.id,
          icon: ONBOARDING_ICON_MAP[opt.iconName],
          title: t(`disciplineStyles.${opt.id}.label`),
          description: t(`disciplineStyles.${opt.id}.desc`),
        }))}
        onSelect={(val) => setField("disciplineStyle", val)}
        disabled={isPending}
      />

      <SettingsOptionGrid
        variant="compact"
        labelId="routine-usage-mode"
        title={t("usageModeTitle")}
        description={t("usageModeDesc")}
        selectedValue={usageMode}
        options={USAGE_MODES.map((opt) => ({
          value: opt.id,
          icon: ONBOARDING_ICON_MAP[opt.iconName],
          title: t(`usageModes.${opt.id}.label`),
          description: t(`usageModes.${opt.id}.desc`),
        }))}
        onSelect={(val) => setField("usageMode", val)}
        disabled={isPending}
      />

      <fieldset className="flex flex-col gap-2.5 border-0 p-0 m-0 min-w-0">
        <legend className="text-body-s font-bold text-neutral-100 p-0 float-none w-full">
          {t("primaryGoalsTitle")}
        </legend>
        <p className="text-tiny text-neutral-400 -mt-1.5">
          {t("primaryGoalsDesc", { max: MAX_PRIMARY_GOALS })}
        </p>
        <div className="flex flex-wrap gap-2">
          {PRIMARY_GOAL_OPTIONS.map((opt) => {
            const Icon = ONBOARDING_ICON_MAP[opt.iconName];
            const isSelected = primaryGoals.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={isSelected}
                disabled={isPending}
                onClick={() => handleToggleGoal(opt.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer disabled:opacity-60",
                  isSelected
                    ? "bg-amber-500/[0.12] dark:bg-primary-dark/60 border-gold text-amber-800 dark:text-gold ring-1 ring-gold"
                    : "bg-surface/45 border-neutral-700 text-neutral-300 hover:border-primary/40 hover:text-neutral-100 dark:bg-surface/40 dark:border-primary/20",
                )}
              >
                {Icon && <Icon size={13} aria-hidden="true" />}
                <span>{t(`goals.${opt.id}`)}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <SettingsOptionGrid
        variant="compact"
        labelId="routine-main-obstacle"
        title={t("mainObstacleTitle")}
        description={t("mainObstacleDesc")}
        selectedValue={mainObstacle}
        options={MAIN_OBSTACLE_OPTIONS.map((opt) => ({
          value: opt.id,
          icon: ONBOARDING_ICON_MAP[opt.iconName],
          title: t(`obstacles.${opt.id}.label`),
          description: t(`obstacles.${opt.id}.desc`),
        }))}
        onSelect={(val) => setField("mainObstacle", val)}
        disabled={isPending}
      />

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-700 dark:border-primary/20">
        <SettingsSaveButton
          type="button"
          onClick={handleSave}
          label={t("save")}
          savingLabel={t("saving")}
          isPending={isPending}
          disabled={!hasChanges}
        />
      </div>
    </div>
  );
}
