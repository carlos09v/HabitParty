import {
  Calendar,
  CalendarDays,
  CalendarRange,
  Clock,
  Clock12,
  CloudRain,
  Coffee,
  Flame,
  Globe,
  Languages,
  type LucideIcon,
  MonitorSmartphone,
  Moon,
  Music,
  ShieldAlert,
  Sun,
  Swords,
  Target,
  UserCircle,
  Volume2,
  VolumeX,
} from "lucide-react";
import type {
  AmbientSoundOption,
  AmbientSoundType,
  GenderOption,
  SettingsOptionConfig,
  SettingsTabId,
  SettingsTabItem,
} from "@/types/settings";
import type {
  AppLocale,
  DateFormat,
  ExperienceMode,
  TimeFormat,
} from "@/types/ui";

export const GENDER_OPTIONS: readonly GenderOption[] = [
  { value: "MALE" },
  { value: "FEMALE" },
  { value: "NON_BINARY" },
  { value: "PREFER_NOT_TO_SAY" },
] as const;

export const SETTINGS_TABS: readonly SettingsTabItem[] = [
  { id: "profile", icon: UserCircle },
  { id: "appearance", icon: MonitorSmartphone },
  { id: "audio", icon: Volume2 },
  { id: "security", icon: ShieldAlert },
] as const;

export const VALID_SETTINGS_TABS: readonly SettingsTabId[] = SETTINGS_TABS.map(
  (t) => t.id,
);

export function isValidSettingsTab(val?: string | null): val is SettingsTabId {
  return VALID_SETTINGS_TABS.includes(val as SettingsTabId);
}

export function resolveSettingsTab(val?: string | null): SettingsTabId {
  return isValidSettingsTab(val) ? val : "profile";
}

export const THEME_OPTIONS: readonly SettingsOptionConfig<"dark" | "light">[] =
  [
    { value: "dark", hasDefaultBadge: true, icon: Moon },
    { value: "light", icon: Sun },
  ] as const;

export const EXPERIENCE_MODE_OPTIONS: readonly SettingsOptionConfig<ExperienceMode>[] =
  [
    { value: "PRODUCTIVITY", hasDefaultBadge: true, icon: Target },
    { value: "GAMIFIED", icon: Swords },
  ] as const;

export const DATE_FORMAT_OPTIONS: readonly (SettingsOptionConfig<DateFormat> & {
  i18nPrefix: "ddmmyyyy" | "mmddyyyy" | "yyyymmdd";
  statusKey: "statusDdmmyyyy" | "statusMmddyyyy" | "statusYyyymmdd";
})[] = [
  {
    value: "DD/MM/YYYY",
    i18nPrefix: "ddmmyyyy",
    statusKey: "statusDdmmyyyy",
    icon: Calendar,
  },
  {
    value: "MM/DD/YYYY",
    i18nPrefix: "mmddyyyy",
    statusKey: "statusMmddyyyy",
    icon: CalendarDays,
  },
  {
    value: "YYYY-MM-DD",
    i18nPrefix: "yyyymmdd",
    statusKey: "statusYyyymmdd",
    icon: CalendarRange,
  },
] as const;

export const TIME_FORMAT_OPTIONS: readonly (SettingsOptionConfig<TimeFormat> & {
  i18nPrefix: "h24" | "h12";
  statusKey: "statusH24" | "statusH12";
})[] = [
  {
    value: "24h",
    i18nPrefix: "h24",
    statusKey: "statusH24",
    icon: Clock,
  },
  {
    value: "12h",
    i18nPrefix: "h12",
    statusKey: "statusH12",
    icon: Clock12,
  },
] as const;

export const LANGUAGE_OPTIONS: readonly (SettingsOptionConfig<AppLocale> & {
  i18nPrefix: "en" | "pt";
})[] = [
  { value: "en", i18nPrefix: "en", icon: Globe },
  { value: "pt-BR", i18nPrefix: "pt", icon: Languages },
] as const;

export const AMBIENT_SOUND_OPTIONS: readonly AmbientSoundOption[] = [
  { id: "none", icon: VolumeX },
  { id: "rain", icon: CloudRain },
  { id: "cafe", icon: Coffee },
  { id: "lofi", icon: Music },
  { id: "fire", icon: Flame },
] as const;

export const AMBIENT_ICONS: Record<AmbientSoundType, LucideIcon> = {
  none: VolumeX,
  rain: CloudRain,
  cafe: Coffee,
  lofi: Music,
  fire: Flame,
};
