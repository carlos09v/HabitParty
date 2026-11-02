"use client";

import { useTranslations } from "next-intl";
import { EXPERIENCE_MODE_OPTIONS } from "@/constants/settings";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { ExperienceMode } from "@/types/ui";
import { SettingsOptionGrid } from "./SettingsOptionGrid";

interface ExperienceModeSettingsProps {
  isCompact?: boolean;
  initialMode?: ExperienceMode;
}

export function ExperienceModeSettings({
  isCompact = false,
}: ExperienceModeSettingsProps) {
  const t = useTranslations("settings.experienceMode");
  const { experienceMode, setExperienceMode, isGamified } = useExperienceMode();

  const statusMessage = (
    <>
      <span className="font-bold">{t("activeLabel")} </span>
      {isGamified ? t("statusGamified") : t("statusProductivity")}
    </>
  );

  const options = EXPERIENCE_MODE_OPTIONS.map((opt) => ({
    ...opt,
    title: opt.value === "GAMIFIED" ? t("gamified") : t("productivity"),
    description:
      opt.value === "GAMIFIED" ? t("gamifiedDesc") : t("productivityDesc"),
    badge: opt.badge ? t("defaultBadge") : undefined,
  }));

  return (
    <SettingsOptionGrid
      statusMessage={statusMessage}
      options={options}
      selectedValue={experienceMode}
      onSelect={(val) => setExperienceMode(val)}
      isCompact={isCompact}
    />
  );
}
