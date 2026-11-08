"use client";

import { useTranslations } from "next-intl";
import { THEME_OPTIONS } from "@/constants/settings";
import { useCompactMode } from "@/hooks/useCompactMode";
import { useThemeMode } from "@/hooks/useThemeMode";
import { cn } from "@/utils";
import { SettingsOptionGrid } from "./SettingsOptionGrid";

interface ThemeSettingsProps {
  isCompact?: boolean;
  className?: string;
}

export function ThemeSettings({
  isCompact: propIsCompact,
  className,
}: ThemeSettingsProps = {}) {
  const t = useTranslations("settings.theme");
  const { theme, setTheme, isDark } = useThemeMode();
  const { isCompact: storeIsCompact } = useCompactMode();
  const isCompact = propIsCompact ?? storeIsCompact;

  const statusMessage = (
    <>
      <span className="font-bold">{t("statusActiveLabel")}</span>
      {isDark ? t("statusDark") : t("statusLight")}
    </>
  );

  const options = THEME_OPTIONS.map((opt) => ({
    value: opt.value,
    icon: opt.icon,
    title: opt.value === "dark" ? t("dark") : t("light"),
    description: opt.value === "dark" ? t("darkDesc") : t("lightDesc"),
    badge: opt.hasDefaultBadge ? t("defaultBadge") : undefined,
  }));

  return (
    <div className={cn(className)}>
      <SettingsOptionGrid
        statusMessage={statusMessage}
        options={options}
        selectedValue={theme}
        onSelect={(val) => setTheme(val)}
        isCompact={isCompact}
      />
    </div>
  );
}
