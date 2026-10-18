import { create } from "zustand";
import { setCompactModeCookie, setThemeCookie } from "@/actions/ui";
import type { ThemeMode } from "@/types/ui";

export interface UIState {
  compactMode: boolean;
  setCompactMode: (compact: boolean) => void;
  toggleCompactMode: () => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
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
  theme: "dark",
  setTheme: (theme) => {
    set({ theme });
    if (typeof document !== "undefined") {
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(theme);
    }
    setThemeCookie(theme);
  },
  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === "light" ? "dark" : "light";
      if (typeof document !== "undefined") {
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(newTheme);
      }
      setThemeCookie(newTheme);
      return { theme: newTheme };
    }),
}));
