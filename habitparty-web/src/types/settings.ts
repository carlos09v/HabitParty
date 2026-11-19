import type { LucideIcon } from "lucide-react";
import type { GenderType, UserResponseDTO } from "./user";

export type { GenderType };

export interface GenderOption {
  value: NonNullable<GenderType>;
}

export interface ProfileHeaderCardProps {
  initialUser: UserResponseDTO | null;
}

export interface ProfileFormProps {
  initialUser: UserResponseDTO | null;
}

export type WelcomeCardStorageKey =
  | "tasks"
  | "inventory"
  | "rewards"
  | "focus"
  | "history";

export interface WelcomeCardConfig {
  key: WelcomeCardStorageKey;
  title: string;
  pageName: string;
  route: string;
  description: string;
  icon: LucideIcon;
}

export interface SettingsOptionConfig<T extends string | boolean> {
  value: T;
  hasDefaultBadge?: boolean;
  icon?: LucideIcon;
}

export interface SettingsOptionItem<T extends string | boolean> {
  value: T;
  title: string;
  badge?: string;
  description: string;
  icon?: LucideIcon;
}

export type SettingsTabId =
  | "profile"
  | "preferences"
  | "appearance"
  | "audio"
  | "privacy"
  | "security";

export interface SettingsTabItem {
  id: SettingsTabId;
  icon: LucideIcon;
}

export type TimerSoundType = "zen" | "arcade" | "digital" | "harp";
export const ALARM_TONE_IDS: readonly TimerSoundType[] = [
  "zen",
  "arcade",
  "digital",
  "harp",
] as const;
export type AmbientSoundType = "none" | "rain" | "cafe" | "lofi" | "fire";

export interface AmbientSoundOption {
  id: AmbientSoundType;
  icon: LucideIcon;
}
