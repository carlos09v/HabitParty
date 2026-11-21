import { create } from "zustand";
import { FOCUS_REWARD_RULES } from "@/constants/focus";
import type { UserResponseDTO } from "@/types/user";

export type { UserResponseDTO };

const MIN_STREAK_FOCUS_MINUTES =
  FOCUS_REWARD_RULES.MIN_DAILY_STREAK_FOCUS_MINUTES;

function applyStreakCompletionIfReady(
  state: Pick<UserState, "user" | "lastStreakSecuredDate">,
  todayIso: string,
  taskCompleted: boolean,
  focusMinutes: number,
): Partial<UserState> {
  const isQualifiedToday =
    taskCompleted || focusMinutes >= MIN_STREAK_FOCUS_MINUTES;
  if (!state.user || !isQualifiedToday) {
    return {
      todayMetricsDate: todayIso,
      todayTaskCompleted: taskCompleted,
      todayFocusMinutes: focusMinutes,
    };
  }
  if (state.lastStreakSecuredDate === todayIso) {
    return {
      todayMetricsDate: todayIso,
      todayTaskCompleted: taskCompleted,
      todayFocusMinutes: focusMinutes,
      lastStreakSecuredDate: todayIso,
    };
  }
  const nextStreak = (state.user.currentStreak ?? 0) + 1;
  const nextHighest = Math.max(state.user.highestStreak ?? 0, nextStreak);
  return {
    todayMetricsDate: todayIso,
    todayTaskCompleted: taskCompleted,
    todayFocusMinutes: focusMinutes,
    lastStreakSecuredDate: todayIso,
    user: {
      ...state.user,
      currentStreak: nextStreak,
      highestStreak: nextHighest,
    },
  };
}

export interface UserState {
  user: UserResponseDTO | null;
  is_Premium: boolean;
  lastStreakSecuredDate: string | null;
  todayMetricsDate: string | null;
  todayTaskCompleted: boolean;
  todayFocusMinutes: number;
  achievementCheckSeq: number;
  achievementSessionEpoch: number;
  setUser: (user: UserResponseDTO | null) => void;
  updateUserPartial: (partial: Partial<UserResponseDTO>) => void;
  setLastStreakSecuredDate: (dateIso: string | null) => void;
  syncTodayStreakMetrics: (
    todayIso: string,
    taskCompleted: boolean,
    focusMinutes: number,
  ) => void;
  recordTaskCompletedToday: (todayIso: string) => void;
  recordFocusMinutesToday: (durationMinutes: number, todayIso: string) => void;
  setIsPremium: (isPremium: boolean) => void;
  togglePremium: () => void;
  triggerAchievementCheck: () => void;
  resetAchievementSession: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  is_Premium: false,
  lastStreakSecuredDate: null,
  todayMetricsDate: null,
  todayTaskCompleted: false,
  todayFocusMinutes: 0,
  achievementCheckSeq: 0,
  achievementSessionEpoch: 0,
  setUser: (user) =>
    set((state) => ({
      user,
      is_Premium: user?.isPremium ?? false,
      achievementSessionEpoch:
        user === null || (state.user?.id && state.user.id !== user.id)
          ? state.achievementSessionEpoch + 1
          : state.achievementSessionEpoch,
    })),
  updateUserPartial: (partial) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...partial } : null,
      is_Premium:
        partial.isPremium !== undefined ? partial.isPremium : state.is_Premium,
    })),
  setLastStreakSecuredDate: (lastStreakSecuredDate) =>
    set({
      lastStreakSecuredDate,
      ...(lastStreakSecuredDate === null
        ? { todayTaskCompleted: false, todayFocusMinutes: 0 }
        : {}),
    }),
  syncTodayStreakMetrics: (todayIso, taskCompleted, focusMinutes) =>
    set((state) => {
      const normalizedMinutes = Math.max(0, Math.round(focusMinutes || 0));
      const sameDay = state.todayMetricsDate === todayIso;
      const mergedTask = sameDay
        ? state.todayTaskCompleted || taskCompleted
        : taskCompleted;
      const mergedFocus = sameDay
        ? Math.max(state.todayFocusMinutes, normalizedMinutes)
        : normalizedMinutes;
      const securedToday =
        mergedTask || mergedFocus >= MIN_STREAK_FOCUS_MINUTES;
      const isZeroStreak = (state.user?.currentStreak ?? 0) === 0;
      const nextSecured = securedToday
        ? todayIso
        : isZeroStreak
          ? null
          : state.lastStreakSecuredDate;
      return {
        todayMetricsDate: todayIso,
        todayTaskCompleted: mergedTask,
        todayFocusMinutes: mergedFocus,
        lastStreakSecuredDate: nextSecured,
      };
    }),
  recordTaskCompletedToday: (todayIso) =>
    set((state) => {
      const sameDay = state.todayMetricsDate === todayIso;
      const currentMinutes = sameDay ? state.todayFocusMinutes : 0;
      return applyStreakCompletionIfReady(
        state,
        todayIso,
        true,
        currentMinutes,
      );
    }),
  recordFocusMinutesToday: (durationMinutes, todayIso) =>
    set((state) => {
      const addedMinutes = Math.max(0, Math.round(durationMinutes || 0));
      const sameDay = state.todayMetricsDate === todayIso;
      const currentTask = sameDay ? state.todayTaskCompleted : false;
      const nextMinutes =
        (sameDay ? state.todayFocusMinutes : 0) + addedMinutes;
      return applyStreakCompletionIfReady(
        state,
        todayIso,
        currentTask,
        nextMinutes,
      );
    }),
  setIsPremium: (is_Premium) => set({ is_Premium }),
  togglePremium: () => set((state) => ({ is_Premium: !state.is_Premium })),
  triggerAchievementCheck: () =>
    set((state) => ({ achievementCheckSeq: state.achievementCheckSeq + 1 })),
  resetAchievementSession: () =>
    set((state) => ({
      achievementSessionEpoch: state.achievementSessionEpoch + 1,
    })),
}));
