"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
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
    value: opt.value,
    icon: opt.icon,
    title: opt.value === "GAMIFIED" ? t("gamified") : t("productivity"),
    description:
      opt.value === "GAMIFIED" ? t("gamifiedDesc") : t("productivityDesc"),
    badge: opt.hasDefaultBadge ? t("defaultBadge") : undefined,
  }));

  const handleSelectMode = (nextMode: ExperienceMode) => {
    if (nextMode === experienceMode) return;
    setExperienceMode(nextMode);
    const modeLabel =
      nextMode === "GAMIFIED" ? t("gamified") : t("productivity");
    toast.success(t("toastSuccess", { mode: modeLabel }));
  };

  return (
    <SettingsOptionGrid
      statusMessage={statusMessage}
      options={options}
      selectedValue={experienceMode}
      onSelect={handleSelectMode}
      isCompact={isCompact}
    />
  );
}
