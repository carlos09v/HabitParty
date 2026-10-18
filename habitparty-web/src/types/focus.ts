import type { components } from "@/api/schema";

export type FocusActivityResponseDTO =
  components["schemas"]["FocusActivityResponseDTO"];
export type CreateFocusActivityDTO =
  components["schemas"]["CreateFocusActivityDTO"];
export type UpdateFocusActivityDTO =
  components["schemas"]["UpdateFocusActivityDTO"];
export type UpdateFocusActivityOrderDTO =
  components["schemas"]["UpdateFocusActivityOrderDTO"];

export type FocusRecordResponseDTO =
  components["schemas"]["FocusRecordResponseDTO"] & {
    xpEarned?: number;
    coinsEarned?: number | string;
  };
export type CreateFocusRecordDTO =
  components["schemas"]["CreateFocusRecordDTO"];
export type UpdateFocusRecordDTO =
  components["schemas"]["UpdateFocusRecordDTO"];

export type FocusRecordType = "POMO" | "STOPWATCH";

export interface FocusActivity {
  id: string;
  name: string;
  icon: string;
  orderIndex: number;
  recordType: FocusRecordType;
  targetTimeMinutes?: number;
  createdAt?: string;
}

export interface FocusRecord {
  id: string;
  userId?: string;
  focusActivityId?: string;
  activityName?: string;
  activityIcon?: string;
  inventoryItemId?: string;
  itemName?: string;
  notes?: string;
  startTime: string;
  endTime: string;
  recordType: FocusRecordType;
  completedPomos?: number;
  durationMinutes: number;
  xpEarned?: number;
  coinsEarned?: number;
}

export type FocusPeriodTab = "HOJE" | "TOTAL";

export interface FocusMetrics {
  todayRecordsCount: number;
  totalRecordsCount: number;
  activeStreakDays: number;
  totalActiveDays: number;
  todayXp: number;
  totalXp: number;
  todayGold: number;
  totalGold: number;
  todayFocusMinutes: number;
  totalFocusMinutes: number;
  todayPomosCount: number;
  totalPomosCount: number;
  todayAverageMinutes: number;
  totalAverageMinutes: number;
}

export interface WeeklyFocusDayData {
  dayLabel: string; // "Dom", "Seg", etc.
  fullDate: string;
  minutes: number;
  heightPercent: number;
  isToday: boolean;
}

export interface FocusActiveTarget {
  type: "activity" | "inventory";
  id: string;
  name: string;
  icon?: string;
  targetMinutes?: number;
  remainingSeconds?: number;
  packageLevel?: string;
}

export type FocusPhase = "WORK" | "SHORT_BREAK" | "LONG_BREAK";

export interface FocusTimerState {
  isActive: boolean;
  isPaused: boolean;
  mode: FocusRecordType;
  phase?: FocusPhase;
  secondsRemaining: number;
  totalDurationSeconds: number;
  elapsedSeconds: number;
  completedCycles: number;
  target: FocusActiveTarget | null;
  startedAt: string | null;
}

export interface FocusTimerControlsState {
  isActive: boolean;
  isPaused: boolean;
  mode: FocusRecordType;
  phase?: FocusPhase;
  target: FocusActiveTarget | null;
  totalDurationSeconds: number;
  startedAt: string | null;
  hasElapsedSeconds: boolean;
  canComplete: boolean;
  isPartialPomo?: boolean;
}
