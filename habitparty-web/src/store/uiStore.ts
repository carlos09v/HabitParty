import { create } from "zustand";
import { updateUserExperienceModeAction } from "@/actions/userActions";
import { useUserStore } from "@/store/userStore";
import type { DateFormat, ExperienceMode, ThemeMode } from "@/types/ui";
import { detectBrowserDateFormat } from "@/utils/date";

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
  compactMode: boolean;
  setCompactMode: (compact: boolean) => void;
  toggleCompactMode: () => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  experienceMode: ExperienceMode;
  setExperienceMode: (mode: ExperienceMode) => void;
  dateFormat: DateFormat;
  setDateFormat: (format: DateFormat) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  hydrated: false,
  compactMode: false,
  setCompactMode: (compactMode) => {
    set({ compactMode, hydrated: true });
    setClientCookie("compactMode", String(compactMode));
  },
  toggleCompactMode: () =>
    set((state) => {
      const newMode = !state.compactMode;
      setClientCookie("compactMode", String(newMode));
      return { compactMode: newMode, hydrated: true };
    }),
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
}));
