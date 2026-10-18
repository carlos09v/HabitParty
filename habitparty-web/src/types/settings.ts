import type { LucideIcon } from "lucide-react";
import type { UserResponseDTO } from "./user";

export type GenderType = "MALE" | "FEMALE" | "NON_BINARY" | "PREFER_NOT_TO_SAY";

export interface GenderOption {
  value: NonNullable<GenderType>;
  label: string;
}

export interface PasswordValidationResult {
  hasMinLength: boolean;
  hasUpperCase: boolean;
  hasSpecialChar: boolean;
  passwordsMatch: boolean;
  isValid: boolean;
}

export interface ProfileCardBaseProps {
  isCompact?: boolean;
}

export interface ProfileHeaderCardProps extends ProfileCardBaseProps {
  initialUser: UserResponseDTO | null;
}

export interface ProfileFormProps extends ProfileCardBaseProps {
  initialUser: UserResponseDTO | null;
}

export interface WelcomeCardConfig {
  key: string;
  title: string;
  pageName: string;
  route: string;
  description: string;
  icon: LucideIcon;
}

export interface SettingsOptionItem<T extends string | boolean> {
  value: T;
  title: string;
  badge?: string;
  description: string;
  icon?: LucideIcon;
}

export type SettingsTabId = "profile" | "appearance" | "audio" | "security";

export interface SettingsTabItem {
  id: SettingsTabId;
  label: string;
  description: string;
  icon: LucideIcon;
  badge?: string;
}

export type TimerSoundType = "zen" | "arcade";
export type AmbientSoundType = "none" | "rain" | "cafe" | "lofi" | "fire";

export interface AmbientSoundOption {
  id: AmbientSoundType;
  label: string;
  description: string;
  icon?: LucideIcon;
}
