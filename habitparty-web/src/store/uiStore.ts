import { create } from "zustand";
import {
  setCompactModeCookie,
  setLocaleCookie,
  setThemeCookie,
} from "@/actions/ui";
import { updateUserExperienceModeAction } from "@/actions/userActions";
import { useUserStore } from "@/store/userStore";
import type { AppLocale, ExperienceMode, ThemeMode } from "@/types/ui";

export interface UIState {
  compactMode: boolean;
  setCompactMode: (compact: boolean) => void;
  toggleCompactMode: () => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  toggleLocale: () => void;
  experienceMode: ExperienceMode;
  setExperienceMode: (mode: ExperienceMode) => void;
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
  locale: "en",
  setLocale: (locale) => {
    set({ locale });
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
    setLocaleCookie(locale);
  },
  toggleLocale: () =>
    set((state) => {
      const newLocale: AppLocale = state.locale === "pt-BR" ? "en" : "pt-BR";
      if (typeof document !== "undefined") {
        document.documentElement.lang = newLocale;
      }
      setLocaleCookie(newLocale);
      return { locale: newLocale };
    }),
  experienceMode: "PRODUCTIVITY",
  setExperienceMode: (experienceMode) => {
    set({ experienceMode });
    useUserStore.getState().updateUserPartial({ experienceMode });
    updateUserExperienceModeAction(experienceMode);
  },
}));
