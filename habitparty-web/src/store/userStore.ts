import { create } from "zustand";

export interface UserState {
  is_Premium: boolean;
  setIsPremium: (isPremium: boolean) => void;
  togglePremium: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  is_Premium: false,
  setIsPremium: (is_Premium) => set({ is_Premium }),
  togglePremium: () => set((state) => ({ is_Premium: !state.is_Premium })),
}));
