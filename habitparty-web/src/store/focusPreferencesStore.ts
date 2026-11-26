import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  DEFAULT_CYCLES_UNTIL_LONG_BREAK,
  DEFAULT_LONG_BREAK_MINUTES,
  DEFAULT_SHORT_BREAK_MINUTES,
} from "@/constants/focusRules";

export const FOCUS_PREFERENCE_LIMITS = {
  shortBreakMinutes: { min: 1, max: 30 },
  longBreakMinutes: { min: 5, max: 60 },
  cyclesUntilLongBreak: { min: 2, max: 8 },
} as const;

export interface FocusTimerPreferences {
  shortBreakMinutes: number;
  longBreakMinutes: number;
  cyclesUntilLongBreak: number;
  autoStartBreak: boolean;
  autoStartNextCycle: boolean;
  pauseAmbientWithTimer: boolean;
}

export const DEFAULT_FOCUS_TIMER_PREFERENCES: FocusTimerPreferences = {
  shortBreakMinutes: DEFAULT_SHORT_BREAK_MINUTES,
  longBreakMinutes: DEFAULT_LONG_BREAK_MINUTES,
  cyclesUntilLongBreak: DEFAULT_CYCLES_UNTIL_LONG_BREAK,
  autoStartBreak: false,
  autoStartNextCycle: false,
  pauseAmbientWithTimer: true,
};

function clampInt(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, Math.round(value)));
}

function sanitizePartialPreferences(
  partial: Partial<FocusTimerPreferences>,
  current: FocusTimerPreferences,
): Partial<FocusTimerPreferences> {
  const next: Partial<FocusTimerPreferences> = {};

  if (partial.shortBreakMinutes !== undefined) {
    next.shortBreakMinutes = clampInt(
      partial.shortBreakMinutes,
      FOCUS_PREFERENCE_LIMITS.shortBreakMinutes.min,
      FOCUS_PREFERENCE_LIMITS.shortBreakMinutes.max,
      current.shortBreakMinutes,
    );
  }
  if (partial.longBreakMinutes !== undefined) {
    next.longBreakMinutes = clampInt(
      partial.longBreakMinutes,
      FOCUS_PREFERENCE_LIMITS.longBreakMinutes.min,
      FOCUS_PREFERENCE_LIMITS.longBreakMinutes.max,
      current.longBreakMinutes,
    );
  }
  if (partial.cyclesUntilLongBreak !== undefined) {
    next.cyclesUntilLongBreak = clampInt(
      partial.cyclesUntilLongBreak,
      FOCUS_PREFERENCE_LIMITS.cyclesUntilLongBreak.min,
      FOCUS_PREFERENCE_LIMITS.cyclesUntilLongBreak.max,
      current.cyclesUntilLongBreak,
    );
  }
  if (typeof partial.autoStartBreak === "boolean") {
    next.autoStartBreak = partial.autoStartBreak;
  }
  if (typeof partial.autoStartNextCycle === "boolean") {
    next.autoStartNextCycle = partial.autoStartNextCycle;
  }
  if (typeof partial.pauseAmbientWithTimer === "boolean") {
    next.pauseAmbientWithTimer = partial.pauseAmbientWithTimer;
  }

  return next;
}

export function hasCustomFocusPreferences(
  prefs: FocusTimerPreferences,
): boolean {
  return (
    prefs.shortBreakMinutes !==
      DEFAULT_FOCUS_TIMER_PREFERENCES.shortBreakMinutes ||
    prefs.longBreakMinutes !==
      DEFAULT_FOCUS_TIMER_PREFERENCES.longBreakMinutes ||
    prefs.cyclesUntilLongBreak !==
      DEFAULT_FOCUS_TIMER_PREFERENCES.cyclesUntilLongBreak ||
    prefs.autoStartBreak !== DEFAULT_FOCUS_TIMER_PREFERENCES.autoStartBreak ||
    prefs.autoStartNextCycle !==
      DEFAULT_FOCUS_TIMER_PREFERENCES.autoStartNextCycle ||
    prefs.pauseAmbientWithTimer !==
      DEFAULT_FOCUS_TIMER_PREFERENCES.pauseAmbientWithTimer
  );
}

export interface FocusPreferencesStoreState extends FocusTimerPreferences {
  setShortBreakMinutes: (minutes: number) => void;
  setLongBreakMinutes: (minutes: number) => void;
  setCyclesUntilLongBreak: (cycles: number) => void;
  setAutoStartBreak: (enabled: boolean) => void;
  setAutoStartNextCycle: (enabled: boolean) => void;
  setPauseAmbientWithTimer: (enabled: boolean) => void;
  resetDefaults: () => void;
}

export const useFocusPreferencesStore = create<FocusPreferencesStoreState>()(
  persist(
    (set) => ({
      ...DEFAULT_FOCUS_TIMER_PREFERENCES,

      setShortBreakMinutes: (minutes) =>
        set((state) => ({
          shortBreakMinutes: clampInt(
            minutes,
            FOCUS_PREFERENCE_LIMITS.shortBreakMinutes.min,
            FOCUS_PREFERENCE_LIMITS.shortBreakMinutes.max,
            state.shortBreakMinutes,
          ),
        })),

      setLongBreakMinutes: (minutes) =>
        set((state) => ({
          longBreakMinutes: clampInt(
            minutes,
            FOCUS_PREFERENCE_LIMITS.longBreakMinutes.min,
            FOCUS_PREFERENCE_LIMITS.longBreakMinutes.max,
            state.longBreakMinutes,
          ),
        })),

      setCyclesUntilLongBreak: (cycles) =>
        set((state) => ({
          cyclesUntilLongBreak: clampInt(
            cycles,
            FOCUS_PREFERENCE_LIMITS.cyclesUntilLongBreak.min,
            FOCUS_PREFERENCE_LIMITS.cyclesUntilLongBreak.max,
            state.cyclesUntilLongBreak,
          ),
        })),

      setAutoStartBreak: (enabled) => set({ autoStartBreak: enabled }),
      setAutoStartNextCycle: (enabled) => set({ autoStartNextCycle: enabled }),
      setPauseAmbientWithTimer: (enabled) =>
        set({ pauseAmbientWithTimer: enabled }),

      resetDefaults: () => set({ ...DEFAULT_FOCUS_TIMER_PREFERENCES }),
    }),
    {
      name: "habitparty_focus_preferences",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        shortBreakMinutes: state.shortBreakMinutes,
        longBreakMinutes: state.longBreakMinutes,
        cyclesUntilLongBreak: state.cyclesUntilLongBreak,
        autoStartBreak: state.autoStartBreak,
        autoStartNextCycle: state.autoStartNextCycle,
        pauseAmbientWithTimer: state.pauseAmbientWithTimer,
      }),
      merge: (persistedState, currentState) => {
        if (!persistedState || typeof persistedState !== "object") {
          return currentState;
        }
        return {
          ...currentState,
          ...sanitizePartialPreferences(
            persistedState as Partial<FocusTimerPreferences>,
            currentState,
          ),
        };
      },
    },
  ),
);
