import { create } from "zustand";
import { updateUserExperienceModeAction } from "@/actions/userActions";
import { useUserStore } from "@/store/userStore";
import type {
  DateFormat,
  ExperienceMode,
  ThemeMode,
  TimeFormat,
} from "@/types/ui";
import { detectBrowserDateFormat, detectBrowserTimeFormat } from "@/utils/date";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function setClientCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  // biome-ignore lint/suspicious/noDocumentCookie: Preferências puramente visuais persistidas localmente sem Server Action roundtrip
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
}

/**
 * Observação: o idioma NÃO vive neste store. A fonte de verdade é o
 * `useLocale()` do next-intl; a troca é feita por `useLocaleSwitcher`
 * (ver `hooks/useLocaleSwitcher.ts` e `store/localeSwitchStore.ts`).
 */
export interface UIState {
  hydrated: boolean;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  experienceMode: ExperienceMode;
  setExperienceMode: (mode: ExperienceMode) => void;
  dateFormat: DateFormat;
  setDateFormat: (format: DateFormat) => void;
  timeFormat: TimeFormat;
  setTimeFormat: (format: TimeFormat) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  hydrated: false,
  theme: "dark",
  setTheme: (theme) => {
    set({ theme, hydrated: true });
    if (typeof document !== "undefined") {
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(theme);
    }
    setClientCookie("theme", theme);
  },
  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === "light" ? "dark" : "light";
      if (typeof document !== "undefined") {
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(newTheme);
      }
      setClientCookie("theme", newTheme);
      return { theme: newTheme, hydrated: true };
    }),
  experienceMode: "PRODUCTIVITY",
  setExperienceMode: (experienceMode) => {
    set({ experienceMode });
    useUserStore.getState().updateUserPartial({ experienceMode });
    updateUserExperienceModeAction(experienceMode);
  },
  dateFormat: detectBrowserDateFormat(),
  setDateFormat: (dateFormat) => {
    set({ dateFormat, hydrated: true });
    setClientCookie("dateFormat", dateFormat);
  },
  timeFormat: detectBrowserTimeFormat(),
  setTimeFormat: (timeFormat) => {
    set({ timeFormat, hydrated: true });
    setClientCookie("timeFormat", timeFormat);
  },
}));
