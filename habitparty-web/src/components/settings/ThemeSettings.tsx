"use client";

import { THEME_OPTIONS } from "@/constants/settings";
import { useCompactMode } from "@/hooks/useCompactMode";
import { useThemeMode } from "@/hooks/useThemeMode";
import { SettingsOptionGrid } from "./SettingsOptionGrid";

interface ThemeSettingsProps {
  isCompact?: boolean;
}

export function ThemeSettings({
  isCompact: propIsCompact,
}: ThemeSettingsProps = {}) {
  const { theme, setTheme, isDark } = useThemeMode();
  const { isCompact: storeIsCompact } = useCompactMode();
  const isCompact = propIsCompact ?? storeIsCompact;

  const statusMessage = (
    <>
      <span className="font-bold">Tema ativo: </span>
      {isDark
        ? "O Tema Escuro está ativo (visual clássico cósmico e místico)."
        : "O Tema Claro está ativo (superfícies limpas e iluminadas em tons de lavanda)."}
    </>
  );

  return (
    <SettingsOptionGrid
      statusMessage={statusMessage}
      options={THEME_OPTIONS}
      selectedValue={theme}
      onSelect={(val) => setTheme(val)}
      isCompact={isCompact}
    />
  );
}
