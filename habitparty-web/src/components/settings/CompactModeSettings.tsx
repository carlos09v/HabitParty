"use client";

import { useTranslations } from "next-intl";
import { COMPACT_OPTIONS } from "@/constants/settings";
import { useCompactMode } from "@/hooks/useCompactMode";
import { SettingsOptionGrid } from "./SettingsOptionGrid";

interface CompactModeSettingsProps {
  isCompact?: boolean;
}

export function CompactModeSettings({
  isCompact: propIsCompact,
}: CompactModeSettingsProps = {}) {
  const t = useTranslations("settings.compactMode");
  const { isCompact: storeIsCompact, setCompactMode } = useCompactMode();
  const isCompact = propIsCompact ?? storeIsCompact;

  const statusMessage = (
    <>
      <span className="font-bold">{t("statusLabel")}</span>
      {isCompact ? t("statusCompact") : t("statusComfortable")}
    </>
  );

  const options = COMPACT_OPTIONS.map((opt) => ({
    ...opt,
    title: opt.value ? t("compact") : t("comfortable"),
    description: opt.value ? t("compactDesc") : t("comfortableDesc"),
    badge: opt.badge ? t("defaultBadge") : undefined,
  }));

  return (
    <SettingsOptionGrid
      statusMessage={statusMessage}
      options={options}
      selectedValue={isCompact}
      onSelect={(val) => setCompactMode(val)}
      isCompact={isCompact}
    />
  );
}
