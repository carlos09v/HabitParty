"use client";

import { Globe, Languages } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCompactMode } from "@/hooks/useCompactMode";
import { useLocaleMode } from "@/hooks/useLocaleMode";
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
  const { locale, setLocale, isEnglish } = useLocaleMode();
  const { isCompact: storeIsCompact } = useCompactMode();
  const isCompact = propIsCompact ?? storeIsCompact;

  const options: SettingsOptionItem<AppLocale>[] = [
    {
      value: "en",
      title: t("enLabel"),
      description: t("enDesc"),
      icon: Globe,
    },
    {
      value: "pt-BR",
      title: t("ptLabel"),
      description: t("ptDesc"),
      icon: Languages,
    },
  ];

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
      selectedValue={locale}
      onSelect={(val) => setLocale(val)}
      isCompact={isCompact}
    />
  );
}
