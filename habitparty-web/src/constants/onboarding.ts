import { STANDARD_THEMES, type ThemeDefinition } from "@/constants/themes";
import type {
  DailyFocusGoalMinutes,
  DisciplineStyle,
  MainObstacle,
  OnboardingOption,
  OnboardingThemeId,
  PeakPeriod,
  PrimaryGoal,
  StarterPackColumnPreset,
  StarterPackFocusPreset,
  StarterPackPlan,
  StarterPackRewardPreset,
  StarterPackSelections,
  StarterPackTaskDescriptionKey,
  StarterPackTaskPreset,
  UsageMode,
} from "@/types/onboarding";
import type { ExperienceMode } from "@/types/ui";

export const MAX_WORKSPACE_NAME_LENGTH = 25;

export const EXPERIENCE_MODES: readonly OnboardingOption<ExperienceMode>[] = [
  { id: "PRODUCTIVITY", iconName: "Target" },
  { id: "GAMIFIED", iconName: "Sparkles" },
] as const;

export const USAGE_MODES: readonly OnboardingOption<UsageMode>[] = [
  { id: "personal", iconName: "User" },
  { id: "studies", iconName: "GraduationCap" },
  { id: "work", iconName: "Briefcase" },
  { id: "all", iconName: "Sparkles" },
] as const;

export const MAX_PRIMARY_GOALS = 2;

export const PRIMARY_GOAL_OPTIONS: readonly OnboardingOption<PrimaryGoal>[] = [
  { id: "focus", iconName: "Timer" },
  { id: "habits", iconName: "Flame" },
  { id: "projects", iconName: "Kanban" },
  { id: "routine", iconName: "CalendarCheck" },
  { id: "balance", iconName: "Coffee" },
] as const;

export const MAIN_OBSTACLE_OPTIONS: readonly OnboardingOption<MainObstacle>[] =
  [
    { id: "procrastination", iconName: "Clock" },
    { id: "distractions", iconName: "Smartphone" },
    { id: "consistency", iconName: "Repeat" },
    { id: "burnout", iconName: "BatteryLow" },
  ] as const;

export const DAILY_FOCUS_GOAL_OPTIONS: readonly OnboardingOption<DailyFocusGoalMinutes>[] =
  [
    { id: 30, iconName: "Zap" },
    { id: 90, iconName: "Target" },
    { id: 180, iconName: "Brain" },
  ] as const;

export const PEAK_PERIOD_OPTIONS: readonly OnboardingOption<PeakPeriod>[] = [
  { id: "morning", iconName: "Sun" },
  { id: "afternoon", iconName: "Compass" },
  { id: "night", iconName: "Moon" },
] as const;

export const DISCIPLINE_STYLE_OPTIONS: readonly OnboardingOption<DisciplineStyle>[] =
  [
    { id: "flexible", iconName: "ShieldCheck" },
    { id: "strict", iconName: "Flame" },
  ] as const;

const ONBOARDING_FREE_THEME_SET = new Set<OnboardingThemeId>([
  "dark",
  "light",
  "dark-knight",
  "solar-parchment",
]);

export const ONBOARDING_FREE_THEMES = STANDARD_THEMES.filter(
  (theme): theme is ThemeDefinition & { id: OnboardingThemeId } =>
    ONBOARDING_FREE_THEME_SET.has(theme.id as OnboardingThemeId),
);

export const DEFAULT_STARTER_PACK_SELECTIONS: StarterPackSelections = {
  createColumns: true,
  createTasks: true,
  createFocusActivity: true,
  createRewards: true,
};

const VALID_USAGE_MODE_SET = new Set<UsageMode>([
  "personal",
  "studies",
  "work",
  "all",
]);
const VALID_PRIMARY_GOAL_SET = new Set<PrimaryGoal>([
  "focus",
  "habits",
  "projects",
  "routine",
  "balance",
]);
const VALID_MAIN_OBSTACLE_SET = new Set<MainObstacle>([
  "procrastination",
  "distractions",
  "consistency",
  "burnout",
]);
const VALID_DAILY_FOCUS_GOAL_SET = new Set<DailyFocusGoalMinutes>([
  30, 90, 180,
]);
const VALID_PEAK_PERIOD_SET = new Set<PeakPeriod>([
  "morning",
  "afternoon",
  "night",
]);
const VALID_DISCIPLINE_STYLE_SET = new Set<DisciplineStyle>([
  "flexible",
  "strict",
]);

export function resolveInitialUsageMode(value?: string | null): UsageMode {
  if (value && VALID_USAGE_MODE_SET.has(value as UsageMode)) {
    return value as UsageMode;
  }
  return "personal";
}

export function resolveInitialPrimaryGoals(
  values?: readonly string[] | null,
): PrimaryGoal[] {
  if (!Array.isArray(values)) return ["focus", "habits"];
  const filtered = values.filter((v): v is PrimaryGoal =>
    VALID_PRIMARY_GOAL_SET.has(v as PrimaryGoal),
  );
  const unique = Array.from(new Set(filtered)).slice(0, MAX_PRIMARY_GOALS);
  return unique.length > 0 ? unique : ["focus", "habits"];
}

export function resolveInitialMainObstacle(
  value?: string | null,
): MainObstacle {
  if (value && VALID_MAIN_OBSTACLE_SET.has(value as MainObstacle)) {
    return value as MainObstacle;
  }
  return "procrastination";
}

export function resolveInitialDailyFocusGoal(
  value?: number | null,
): DailyFocusGoalMinutes {
  if (
    typeof value === "number" &&
    VALID_DAILY_FOCUS_GOAL_SET.has(value as DailyFocusGoalMinutes)
  ) {
    return value as DailyFocusGoalMinutes;
  }
  return 90;
}

export function resolveInitialPeakPeriod(value?: string | null): PeakPeriod {
  if (value && VALID_PEAK_PERIOD_SET.has(value as PeakPeriod)) {
    return value as PeakPeriod;
  }
  return "morning";
}

export function resolveInitialDisciplineStyle(
  value?: string | null,
): DisciplineStyle {
  if (value && VALID_DISCIPLINE_STYLE_SET.has(value as DisciplineStyle)) {
    return value as DisciplineStyle;
  }
  return "flexible";
}

const COLUMNS_BY_MODE: Record<UsageMode, StarterPackColumnPreset[]> = {
  personal: [
    { key: "personalRoutine", icon: "sun" },
    { key: "personalHealth", icon: "heart" },
    { key: "personalGoals", icon: "target" },
  ],
  studies: [
    { key: "studiesClasses", icon: "book" },
    { key: "studiesPractice", icon: "target" },
    { key: "studiesReview", icon: "sparkles" },
  ],
  work: [
    { key: "workPriorities", icon: "briefcase" },
    { key: "workDeepWork", icon: "laptop" },
    { key: "workFollowUp", icon: "check" },
  ],
  all: [
    { key: "allRoutine", icon: "sun" },
    { key: "allFocus", icon: "target" },
    { key: "allWellbeing", icon: "heart" },
  ],
};

interface ModeTaskTriplet {
  habit: StarterPackTaskPreset;
  daily: StarterPackTaskPreset;
  todo: StarterPackTaskPreset;
}

const TASKS_BY_MODE: Record<UsageMode, ModeTaskTriplet> = {
  personal: {
    habit: {
      key: "personalHydrateHabit",
      taskType: "HABIT",
      difficulty: "EASY",
      importanceType: "NORMAL",
      columnIndex: 1,
    },
    daily: {
      key: "personalTopDaily",
      taskType: "DAILY",
      difficulty: "MEDIUM",
      columnIndex: 0,
    },
    todo: {
      key: "personalWeeklyTodo",
      taskType: "TODO",
      difficulty: "MEDIUM",
      isHardcoreIfStrict: true,
      columnIndex: 2,
    },
  },
  studies: {
    habit: {
      key: "studiesRecallHabit",
      taskType: "HABIT",
      difficulty: "EASY",
      importanceType: "HIGH",
      columnIndex: 1,
    },
    daily: {
      key: "studiesReviewDaily",
      taskType: "DAILY",
      difficulty: "MEDIUM",
      columnIndex: 2,
    },
    todo: {
      key: "studiesModuleTodo",
      taskType: "TODO",
      difficulty: "MEDIUM",
      isHardcoreIfStrict: true,
      columnIndex: 0,
    },
  },
  work: {
    habit: {
      key: "workInboxHabit",
      taskType: "HABIT",
      difficulty: "EASY",
      importanceType: "NORMAL",
      columnIndex: 2,
    },
    daily: {
      key: "workPlanDaily",
      taskType: "DAILY",
      difficulty: "MEDIUM",
      columnIndex: 0,
    },
    todo: {
      key: "workDeliverableTodo",
      taskType: "TODO",
      difficulty: "HARD",
      isHardcoreIfStrict: true,
      columnIndex: 1,
    },
  },
  all: {
    habit: {
      key: "allResetHabit",
      taskType: "HABIT",
      difficulty: "EASY",
      importanceType: "NORMAL",
      columnIndex: 2,
    },
    daily: {
      key: "allTop3Daily",
      taskType: "DAILY",
      difficulty: "MEDIUM",
      columnIndex: 0,
    },
    todo: {
      key: "allPriorityTodo",
      taskType: "TODO",
      difficulty: "MEDIUM",
      isHardcoreIfStrict: true,
      columnIndex: 1,
    },
  },
};

const OBSTACLE_HABIT_CONFIG: Record<
  Exclude<MainObstacle, "consistency">,
  {
    key:
      | "obstacleProcrastinationHabit"
      | "obstacleDistractionsHabit"
      | "obstacleBurnoutHabit";
    descriptionKey: StarterPackTaskDescriptionKey;
    columnIndexByMode: Record<UsageMode, number>;
  }
> = {
  procrastination: {
    key: "obstacleProcrastinationHabit",
    descriptionKey: "obstacleProcrastination",
    columnIndexByMode: { personal: 0, studies: 0, work: 0, all: 0 },
  },
  distractions: {
    key: "obstacleDistractionsHabit",
    descriptionKey: "obstacleDistractions",
    columnIndexByMode: { personal: 1, studies: 1, work: 1, all: 1 },
  },
  burnout: {
    key: "obstacleBurnoutHabit",
    descriptionKey: "obstacleBurnout",
    columnIndexByMode: { personal: 1, studies: 2, work: 2, all: 2 },
  },
};

const FOCUS_BY_MODE: Record<
  UsageMode,
  Omit<StarterPackFocusPreset, "targetTimeMinutes">
> = {
  personal: { key: "personalProject", icon: "sparkles", recordType: "POMO" },
  studies: { key: "studiesSession", icon: "book", recordType: "POMO" },
  work: { key: "workDeepFocus", icon: "laptop", recordType: "POMO" },
  all: { key: "allMainFocus", icon: "target", recordType: "POMO" },
};

const MICRO_RESET_REWARD: StarterPackRewardPreset = {
  key: "microReset",
  icon: "coffee",
  price: 2,
  category: "WELLNESS",
  type: "TIME_BASED",
  baseDurationMinutes: 8,
};

const STARTER_REWARDS: StarterPackRewardPreset[] = [
  {
    key: "quickBreak",
    icon: "coffee",
    price: 4,
    category: "WELLNESS",
    type: "TIME_BASED",
    baseDurationMinutes: 15,
  },
  {
    key: "guiltFreeLeisure",
    icon: "gamepad",
    price: 12,
    category: "ENTERTAINMENT",
    type: "TIME_BASED",
    baseDurationMinutes: 45,
  },
];

const PEAK_ROUTINE_ICON: Record<PeakPeriod, string> = {
  morning: "sun",
  afternoon: "sparkles",
  night: "moon",
};

const PEAK_DESCRIPTION_KEY: Record<PeakPeriod, StarterPackTaskDescriptionKey> =
  {
    morning: "peakMorning",
    afternoon: "peakAfternoon",
    night: "peakNight",
  };

/**
 * Monta o plano determinístico do Starter Pack com base em todas as escolhas
 * coletadas no wizard (perfil de uso, objetivos, obstáculo, meta de foco,
 * período de pico e nível de cobrança), preservando a proporção 4:1 nas recompensas.
 */
export function buildStarterPackPlan(options: {
  usageMode: UsageMode;
  primaryGoals?: readonly PrimaryGoal[];
  mainObstacle?: MainObstacle;
  dailyFocusGoalMinutes: DailyFocusGoalMinutes;
  peakPeriod: PeakPeriod;
  disciplineStyle?: DisciplineStyle;
}): StarterPackPlan {
  const {
    usageMode,
    primaryGoals = ["focus", "habits"],
    mainObstacle = "procrastination",
    dailyFocusGoalMinutes,
    peakPeriod,
    disciplineStyle = "flexible",
  } = options;

  const isBurnout = mainObstacle === "burnout";
  const isProcrastination = mainObstacle === "procrastination";
  const isStrict = disciplineStyle === "strict";
  const hasFocusGoal = primaryGoals.includes("focus");
  const hasHabitsGoal = primaryGoals.includes("habits");
  const hasProjectsGoal = primaryGoals.includes("projects");
  const hasRoutineGoal = primaryGoals.includes("routine");
  const hasBalanceGoal = primaryGoals.includes("balance");

  // 1. Colunas: preserva ícones semânticos de Estudos ("book") e Trabalho ("briefcase"),
  // adaptando apenas colunas de rotina diária ao período de pico escolhido.
  const columns = COLUMNS_BY_MODE[usageMode].map((col) =>
    col.key === "personalRoutine" || col.key === "allRoutine"
      ? { ...col, icon: PEAK_ROUTINE_ICON[peakPeriod] }
      : col,
  );

  // 2. Tarefas adaptadas (1-2 Hábitos, 1 Diária, 1 Afazer)
  const triplet = TASKS_BY_MODE[usageMode];
  const tasks: StarterPackTaskPreset[] = [];

  const modeHabit: StarterPackTaskPreset = {
    ...triplet.habit,
    importanceType: isBurnout
      ? "LOW"
      : hasHabitsGoal || mainObstacle === "consistency" || isStrict
        ? "HIGH"
        : (triplet.habit.importanceType ?? "NORMAL"),
    descriptionKey:
      mainObstacle === "consistency"
        ? "obstacleConsistency"
        : hasHabitsGoal
          ? "goalHabits"
          : undefined,
  };

  if (mainObstacle === "consistency") {
    tasks.push(modeHabit);
  } else {
    const obstacleCfg = OBSTACLE_HABIT_CONFIG[mainObstacle];
    const obstacleHabit: StarterPackTaskPreset = {
      key: obstacleCfg.key,
      taskType: "HABIT",
      difficulty: "EASY",
      importanceType: isBurnout ? "NORMAL" : isStrict ? "HIGH" : "NORMAL",
      descriptionKey: obstacleCfg.descriptionKey,
      columnIndex: obstacleCfg.columnIndexByMode[usageMode],
    };
    tasks.push(obstacleHabit);
    if (hasHabitsGoal) {
      tasks.push(modeHabit);
    }
  }

  const dailyTask: StarterPackTaskPreset = {
    ...triplet.daily,
    difficulty:
      isBurnout || isProcrastination ? "EASY" : triplet.daily.difficulty,
    priority: hasRoutineGoal ? "HIGH" : undefined,
    descriptionKey: PEAK_DESCRIPTION_KEY[peakPeriod],
  };
  tasks.push(dailyTask);

  const todoTask: StarterPackTaskPreset = {
    ...triplet.todo,
    difficulty:
      isBurnout || isProcrastination
        ? "EASY"
        : hasProjectsGoal && isStrict
          ? "HARD"
          : triplet.todo.difficulty,
    priority: hasProjectsGoal || hasFocusGoal ? "HIGH" : undefined,
    descriptionKey: hasFocusGoal
      ? "goalFocus"
      : hasProjectsGoal
        ? "goalProjects"
        : isStrict
          ? "disciplineStrict"
          : undefined,
  };
  tasks.push(todoTask);

  // 3. Atividade de foco calibrada pela meta diária
  const targetTimeMinutes =
    dailyFocusGoalMinutes === 30 ? 25 : dailyFocusGoalMinutes === 90 ? 35 : 50;
  const focusBase = FOCUS_BY_MODE[usageMode];

  // 4. Recompensas (adiciona micro-pausa acessível na proporção 4:1 se buscar equilíbrio ou anti-burnout)
  const rewards =
    hasBalanceGoal || isBurnout
      ? [MICRO_RESET_REWARD, ...STARTER_REWARDS]
      : [...STARTER_REWARDS];

  return {
    columns,
    tasks,
    focusActivity: {
      ...focusBase,
      targetTimeMinutes,
    },
    rewards,
  };
}
