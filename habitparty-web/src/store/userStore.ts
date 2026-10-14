import { create } from "zustand";
import type { components } from "@/api/schema";

export type UserResponseDTO = components["schemas"]["UserResponseDTO"];

export interface UserState {
  user: UserResponseDTO | null;
  is_Premium: boolean;
  setUser: (user: UserResponseDTO | null) => void;
  updateUserPartial: (partial: Partial<UserResponseDTO>) => void;
  setIsPremium: (isPremium: boolean) => void;
  togglePremium: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  is_Premium: false,
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
  setIsPremium: (is_Premium) => set({ is_Premium }),
  togglePremium: () => set((state) => ({ is_Premium: !state.is_Premium })),
}));
