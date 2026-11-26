"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { ExperienceModeMiniPreview } from "@/components/ui/ExperienceModeMiniPreview";
import { EXPERIENCE_MODE_OPTIONS } from "@/constants/settings";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { ExperienceMode } from "@/types/ui";
import { SettingsOptionGrid } from "./SettingsOptionGrid";

interface ExperienceModeSettingsProps {
  initialMode?: ExperienceMode;
}

export function ExperienceModeSettings({
  initialMode,
}: ExperienceModeSettingsProps = {}) {
  const t = useTranslations("settings.experienceMode");
  const { experienceMode, setExperienceMode, isGamified } = useExperienceMode(
    initialMode ?? undefined,
  );
  const [pendingMode, setPendingMode] = useState<ExperienceMode | null>(null);

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

  const handleSelectMode = async (nextMode: ExperienceMode) => {
    if (nextMode === experienceMode || pendingMode !== null) return;
    setPendingMode(nextMode);
    try {
      const res = await setExperienceMode(nextMode);
      if (!res.success) {
        toast.error(res.error || t("saveError"));
      }
    } finally {
      setPendingMode(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <SettingsOptionGrid
        statusMessage={statusMessage}
        options={options}
        selectedValue={experienceMode}
        onSelect={(val) => void handleSelectMode(val)}
        disabled={pendingMode !== null}
        pendingValue={pendingMode}
      />

      {/* Live Mini-Preview adaptativo */}
      <ExperienceModeMiniPreview
        isGamified={isGamified}
        label={t("previewLabel")}
        sampleTask={t("previewSampleTask")}
        rewardText={
          isGamified
            ? t("previewGamifiedReward")
            : t("previewProductivityReward")
        }
        badgeText={
          isGamified ? t("previewGamifiedBadge") : t("previewProductivityBadge")
        }
      />
    </div>
  );
}
