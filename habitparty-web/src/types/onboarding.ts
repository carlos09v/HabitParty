import type { ExperienceMode, ThemeId } from "./ui";

export type UsageMode = "personal" | "studies" | "work" | "all";

export type PrimaryGoal =
  | "focus"
  | "habits"
  | "projects"
  | "routine"
  | "balance";

export type MainObstacle =
  | "procrastination"
  | "distractions"
  | "consistency"
  | "burnout";

export type DailyFocusGoalMinutes = 30 | 90 | 180;

export type PeakPeriod = "morning" | "afternoon" | "night";

export type DisciplineStyle = "flexible" | "strict";

export type OnboardingIconKey =
  | "Target"
  | "Sparkles"
  | "User"
  | "GraduationCap"
  | "Briefcase"
  | "Timer"
  | "Flame"
  | "Kanban"
  | "CalendarCheck"
  | "Coffee"
  | "Clock"
  | "Smartphone"
  | "Repeat"
  | "BatteryLow"
  | "Zap"
  | "Brain"
  | "Sun"
  | "Compass"
  | "Moon"
  | "ShieldCheck";

export interface OnboardingOption<T extends string | number> {
  id: T;
  iconName: OnboardingIconKey;
}

export interface StarterPackSelections {
  createColumns: boolean;
  createTasks: boolean;
  createFocusActivity: boolean;
  createRewards: boolean;
}

export type StarterPackColumnKey =
  | "personalRoutine"
  | "personalHealth"
  | "personalGoals"
  | "studiesClasses"
  | "studiesPractice"
  | "studiesReview"
  | "workPriorities"
  | "workDeepWork"
  | "workFollowUp"
  | "allRoutine"
  | "allFocus"
  | "allWellbeing";

export type StarterPackTaskKey =
  | "personalHydrateHabit"
  | "personalTopDaily"
  | "personalWeeklyTodo"
  | "studiesRecallHabit"
  | "studiesReviewDaily"
  | "studiesModuleTodo"
  | "workInboxHabit"
  | "workPlanDaily"
  | "workDeliverableTodo"
  | "allResetHabit"
  | "allTop3Daily"
  | "allPriorityTodo"
  | "obstacleProcrastinationHabit"
  | "obstacleDistractionsHabit"
  | "obstacleBurnoutHabit";

export type StarterPackTaskDescriptionKey =
  | "goalFocus"
  | "goalHabits"
  | "goalProjects"
  | "obstacleProcrastination"
  | "obstacleDistractions"
  | "obstacleConsistency"
  | "obstacleBurnout"
  | "peakMorning"
  | "peakAfternoon"
  | "peakNight"
  | "disciplineStrict";

export type StarterPackFocusKey =
  | "personalProject"
  | "studiesSession"
  | "workDeepFocus"
  | "allMainFocus";

export type StarterPackRewardKey =
  | "microReset"
  | "quickBreak"
  | "guiltFreeLeisure";

export type OnboardingThemeId =
  | "dark"
  | "light"
  | "dark-knight"
  | "solar-parchment";

export interface StarterPackColumnPreset {
  key: StarterPackColumnKey;
  icon: string;
}

export interface StarterPackTaskPreset {
  key: StarterPackTaskKey;
  taskType: "HABIT" | "DAILY" | "TODO";
  difficulty: "TRIVIAL" | "EASY" | "MEDIUM" | "HARD";
  /** Corresponde ao enum `TaskPriority.Low` na API Java. */
  priority?: "NONE" | "Low" | "MEDIUM" | "HIGH";
  importanceType?: "LOW" | "NORMAL" | "HIGH";
  isHardcoreIfStrict?: boolean;
  descriptionKey?: StarterPackTaskDescriptionKey;
  columnIndex: number;
}

export interface StarterPackFocusPreset {
  key: StarterPackFocusKey;
  icon: string;
  recordType: "POMO" | "STOPWATCH";
  targetTimeMinutes: number;
}

export interface StarterPackRewardPreset {
  key: StarterPackRewardKey;
  icon: string;
  price: number;
  category: "ENTERTAINMENT" | "WELLNESS" | "HOBBIES";
  type: "TIME_BASED" | "SINGLE_USE";
  baseDurationMinutes?: number;
}

export interface StarterPackPlan {
  columns: StarterPackColumnPreset[];
  tasks: StarterPackTaskPreset[];
  focusActivity: StarterPackFocusPreset;
  rewards: StarterPackRewardPreset[];
}

export interface FirstStepCompletionPayload {
  workspaceName: string;
  usageMode: UsageMode;
  experienceMode: ExperienceMode;
  theme: ThemeId;
  primaryGoals: PrimaryGoal[];
  mainObstacle: MainObstacle;
  dailyFocusGoalMinutes: DailyFocusGoalMinutes;
  peakPeriod: PeakPeriod;
  disciplineStyle: DisciplineStyle;
  startBlank: boolean;
  starterPack: StarterPackSelections;
  clientTimeZone?: string;
}
