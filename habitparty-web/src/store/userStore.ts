import { create } from "zustand";
import { type AvatarFrameId, getAvatarFrame } from "@/constants/avatarFrames";
import { FOCUS_REWARD_RULES } from "@/constants/focusRules";
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

function applyFocusMinutesDelta(
  state: UserState,
  deltaMinutes: number,
  todayIso: string,
): Partial<UserState> {
  const delta = Math.round(deltaMinutes || 0);
  const sameDay = state.todayMetricsDate === todayIso;
  const currentTask = sameDay ? state.todayTaskCompleted : false;
  const currentMinutes = sameDay ? state.todayFocusMinutes : 0;
  const nextMinutes = Math.max(0, currentMinutes + delta);

  if (delta >= 0) {
    return applyStreakCompletionIfReady(
      state,
      todayIso,
      currentTask,
      nextMinutes,
    );
  }

  const lostFocusStreak =
    !currentTask &&
    nextMinutes < MIN_STREAK_FOCUS_MINUTES &&
    state.lastStreakSecuredDate === todayIso;
  const nextStreak =
    lostFocusStreak && state.user
      ? Math.max(0, (state.user.currentStreak ?? 0) - 1)
      : state.user?.currentStreak;

  return {
    todayMetricsDate: todayIso,
    todayTaskCompleted: currentTask,
    todayFocusMinutes: nextMinutes,
    lastStreakSecuredDate: lostFocusStreak ? null : state.lastStreakSecuredDate,
    ...(lostFocusStreak && state.user
      ? {
          user: {
            ...state.user,
            currentStreak: nextStreak,
          },
        }
      : {}),
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
  revertTaskCompletionToday: (
    todayIso: string,
    streakReverted: boolean,
  ) => void;
  recordFocusMinutesToday: (durationMinutes: number, todayIso: string) => void;
  adjustFocusMinutesToday: (deltaMinutes: number, todayIso: string) => void;
  setIsPremium: (isPremium: boolean) => void;
  togglePremium: () => void;
  triggerAchievementCheck: () => void;
  resetAchievementSession: () => void;
  clearUserSession: () => void;
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
  revertTaskCompletionToday: (todayIso, streakReverted) =>
    set((state) => {
      const sameDay = state.todayMetricsDate === todayIso;
      const shouldDecrementStreak = Boolean(streakReverted && state.user);
      const nextStreak = shouldDecrementStreak
        ? Math.max(0, (state.user?.currentStreak ?? 0) - 1)
        : state.user?.currentStreak;
      return {
        todayMetricsDate: todayIso,
        todayTaskCompleted: streakReverted
          ? false
          : sameDay
            ? state.todayTaskCompleted
            : false,
        lastStreakSecuredDate: streakReverted
          ? null
          : state.lastStreakSecuredDate,
        user:
          shouldDecrementStreak && state.user
            ? {
                ...state.user,
                currentStreak: nextStreak,
              }
            : state.user,
      };
    }),
  recordFocusMinutesToday: (durationMinutes, todayIso) =>
    set((state) =>
      applyFocusMinutesDelta(
        state,
        Math.max(0, Math.round(durationMinutes || 0)),
        todayIso,
      ),
    ),
  adjustFocusMinutesToday: (deltaMinutes, todayIso) =>
    set((state) => applyFocusMinutesDelta(state, deltaMinutes, todayIso)),
  setIsPremium: (is_Premium) => set({ is_Premium }),
  togglePremium: () => set((state) => ({ is_Premium: !state.is_Premium })),
  triggerAchievementCheck: () =>
    set((state) => ({ achievementCheckSeq: state.achievementCheckSeq + 1 })),
  resetAchievementSession: () =>
    set((state) => ({
      achievementSessionEpoch: state.achievementSessionEpoch + 1,
    })),
  clearUserSession: () =>
    set((state) => ({
      user: null,
      is_Premium: false,
      lastStreakSecuredDate: null,
      todayMetricsDate: null,
      todayTaskCompleted: false,
      todayFocusMinutes: 0,
      achievementCheckSeq: 0,
      achievementSessionEpoch: state.achievementSessionEpoch + 1,
    })),
}));

/**
 * Resolve de forma pura e segura a moldura ativa do avatar considerando o status Premium.
 */
export function resolveUserAvatarFrame(
  avatarFrame?: string | null,
  isPremium = false,
): AvatarFrameId {
  const candidate = avatarFrame ?? (isPremium ? "cosmic_gold" : "none");
  const resolved = getAvatarFrame(candidate);
  if (resolved.isPremium && !isPremium) {
    return "none";
  }
  return resolved.id;
}

/**
 * Retorna a moldura ativa diretamente do `userStore` (fonte única de verdade, sem localStorage/re-render extra).
 */
export function useActiveAvatarFrame(): AvatarFrameId {
  const avatarFrame = useUserStore((s) => s.user?.avatarFrame);
  const isPremium = useUserStore((s) => s.is_Premium);
  return resolveUserAvatarFrame(avatarFrame, isPremium);
}
