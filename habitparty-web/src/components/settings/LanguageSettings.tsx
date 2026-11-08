"use client";

import { useTranslations } from "next-intl";
import { LANGUAGE_OPTIONS } from "@/constants/settings";
import { useCompactMode } from "@/hooks/useCompactMode";
import { useLocaleSwitcher } from "@/hooks/useLocaleSwitcher";
import type { SettingsOptionItem } from "@/types/settings";
import type { AppLocale } from "@/types/ui";
import { SettingsOptionGrid } from "./SettingsOptionGrid";

interface LanguageSettingsProps {
  isCompact?: boolean;
}

export function LanguageSettings({
  isCompact: propIsCompact,
}: LanguageSettingsProps = {}) {
  const t = useTranslations("settings.languageCard");
  const { locale, setLocale, isEnglish, isSwitching, pendingLocale } =
    useLocaleSwitcher();
  const { isCompact: storeIsCompact } = useCompactMode();
  const isCompact = propIsCompact ?? storeIsCompact;

  const options: SettingsOptionItem<AppLocale>[] = LANGUAGE_OPTIONS.map(
    (opt) => ({
      value: opt.value,
      title: t(`${opt.i18nPrefix}Label`),
      description: t(`${opt.i18nPrefix}Desc`),
      icon: opt.icon,
    }),
  );

  const statusMessage = (
    <>
      <span className="font-bold">{t("activeLabel")}</span>
      {isEnglish ? t("statusEn") : t("statusPt")}
    </>
  );

  return (
    <SettingsOptionGrid
      statusMessage={statusMessage}
      options={options}
      selectedValue={pendingLocale ?? locale}
      onSelect={(val) => setLocale(val)}
      isCompact={isCompact}
      disabled={isSwitching}
      pendingValue={pendingLocale}
    />
  );
}
