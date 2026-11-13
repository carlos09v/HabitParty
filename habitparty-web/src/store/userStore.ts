import { create } from "zustand";
import type { components } from "@/api/schema";

export type UserResponseDTO = components["schemas"]["UserResponseDTO"];

export interface UserState {
  user: UserResponseDTO | null;
  is_Premium: boolean;
  lastStreakSecuredDate: string | null;
  setUser: (user: UserResponseDTO | null) => void;
  updateUserPartial: (partial: Partial<UserResponseDTO>) => void;
  setLastStreakSecuredDate: (dateIso: string | null) => void;
  markStreakSecuredToday: (todayIso: string) => void;
  setIsPremium: (isPremium: boolean) => void;
  togglePremium: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  is_Premium: false,
  lastStreakSecuredDate: null,
  setUser: (user) =>
    set({
      user,
      is_Premium: user?.isPremium ?? false,
    }),
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
}));
