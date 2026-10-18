"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { AMBIENT_SOUND_OPTIONS } from "@/constants/settings";
import type {
  AmbientSoundOption,
  AmbientSoundType,
  TimerSoundType,
} from "@/types/settings";

export type { TimerSoundType, AmbientSoundType, AmbientSoundOption };
export { AMBIENT_SOUND_OPTIONS };

export interface SoundPreferencesState {
  uiSoundsEnabled: boolean;
  timerSoundsEnabled: boolean;
  timerVolume: number; // 0.0 to 1.0 (default 0.8 = 80%)
  timerSoundType: TimerSoundType;
  browserNotificationsEnabled: boolean;

  // Ruídos de Foco Ambiente (Benefício Premium)
  ambientSoundType: AmbientSoundType;
  ambientVolume: number; // 0.0 to 1.0 (default 0.5 = 50%)
  isAmbientPlaying: boolean;

  setUiSoundsEnabled: (enabled: boolean) => void;
  toggleUiSounds: () => void;
  setTimerSoundsEnabled: (enabled: boolean) => void;
  toggleTimerSounds: () => void;
  setTimerVolume: (volume: number) => void;
  setTimerSoundType: (type: TimerSoundType) => void;
  setBrowserNotificationsEnabled: (enabled: boolean) => void;

  setAmbientSoundType: (type: AmbientSoundType) => void;
  setAmbientVolume: (volume: number) => void;
  setIsAmbientPlaying: (playing: boolean) => void;
  toggleAmbientPlaying: () => void;
}

export const useSoundPreferencesStore = create<SoundPreferencesState>()(
  persist(
    (set) => ({
      uiSoundsEnabled: true,
      timerSoundsEnabled: true,
      timerVolume: 0.8,
      timerSoundType: "zen",
      browserNotificationsEnabled: false,

      ambientSoundType: "none",
      ambientVolume: 0.5,
      isAmbientPlaying: false,

      setUiSoundsEnabled: (enabled) => set({ uiSoundsEnabled: enabled }),
      toggleUiSounds: () =>
        set((state) => ({ uiSoundsEnabled: !state.uiSoundsEnabled })),
      setTimerSoundsEnabled: (enabled) => set({ timerSoundsEnabled: enabled }),
      toggleTimerSounds: () =>
        set((state) => ({ timerSoundsEnabled: !state.timerSoundsEnabled })),
      setTimerVolume: (volume) =>
        set({ timerVolume: Math.max(0, Math.min(1, volume)) }),
      setTimerSoundType: (type) => set({ timerSoundType: type }),
      setBrowserNotificationsEnabled: (enabled) =>
        set({ browserNotificationsEnabled: enabled }),

      setAmbientSoundType: (type) =>
        set({
          ambientSoundType: type,
          isAmbientPlaying: type !== "none",
        }),
      setAmbientVolume: (volume) =>
        set({ ambientVolume: Math.max(0, Math.min(1, volume)) }),
      setIsAmbientPlaying: (playing) => set({ isAmbientPlaying: playing }),
      toggleAmbientPlaying: () =>
        set((state) => ({
          isAmbientPlaying: !state.isAmbientPlaying,
          ambientSoundType:
            !state.isAmbientPlaying && state.ambientSoundType === "none"
              ? "rain"
              : state.ambientSoundType,
        })),
    }),
    {
      name: "habitparty_sound_preferences",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

/**
 * Hook seguro com garantia contra hydration mismatch em Server Components / SSR
 */
export function useSoundPreferences() {
  const store = useSoundPreferencesStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return {
    ...store,
    mounted,
  };
}
