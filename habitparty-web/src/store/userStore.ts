import { create } from "zustand";
import type { UserResponseDTO } from "@/types/user";

export type { UserResponseDTO };

export interface UserState {
  user: UserResponseDTO | null;
  is_Premium: boolean;
  lastStreakSecuredDate: string | null;
  achievementCheckSeq: number;
  achievementSessionEpoch: number;
  setUser: (user: UserResponseDTO | null) => void;
  updateUserPartial: (partial: Partial<UserResponseDTO>) => void;
  setLastStreakSecuredDate: (dateIso: string | null) => void;
  markStreakSecuredToday: (todayIso: string) => void;
  setIsPremium: (isPremium: boolean) => void;
  togglePremium: () => void;
  triggerAchievementCheck: () => void;
  resetAchievementSession: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  is_Premium: false,
  lastStreakSecuredDate: null,
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
    set({ lastStreakSecuredDate }),
  markStreakSecuredToday: (todayIso) =>
    set((state) => {
      if (!state.user || state.lastStreakSecuredDate === todayIso) {
        return { lastStreakSecuredDate: todayIso };
      }
      const nextStreak = (state.user.currentStreak ?? 0) + 1;
      const nextHighest = Math.max(state.user.highestStreak ?? 0, nextStreak);
      return {
        lastStreakSecuredDate: todayIso,
        user: {
          ...state.user,
          currentStreak: nextStreak,
          highestStreak: nextHighest,
        },
      };
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
