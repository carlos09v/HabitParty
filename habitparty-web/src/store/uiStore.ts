import { create } from "zustand";
import { setCompactModeCookie } from "@/actions/ui";

export interface UIState {
  compactMode: boolean;
  setCompactMode: (compact: boolean) => void;
  toggleCompactMode: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  compactMode: false,
  setCompactMode: (compactMode) => {
    set({ compactMode });
    setCompactModeCookie(compactMode);
  },
  toggleCompactMode: () =>
    set((state) => {
      const newMode = !state.compactMode;
      setCompactModeCookie(newMode);
      return { compactMode: newMode };
    }),
}));
