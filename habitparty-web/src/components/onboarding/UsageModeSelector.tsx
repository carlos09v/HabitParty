"use client";

import { useTranslations } from "next-intl";
import { USAGE_MODES } from "@/constants/onboarding";
import type { UsageMode } from "@/types/onboarding";
import { OnboardingSelectableCard } from "./OnboardingSelectableCard";

interface UsageModeSelectorProps {
  selectedMode: UsageMode;
  onSelect: (mode: UsageMode) => void;
}

export function UsageModeSelector({
  selectedMode,
  onSelect,
}: UsageModeSelectorProps) {
  const t = useTranslations("onboarding.usageModes");

  return (
    <fieldset className="flex flex-col gap-2.5 m-0 p-0 border-0">
      <legend className="text-body-s font-bold text-neutral-100 mb-2">
        {t("sectionTitle")}
      </legend>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5">
        {USAGE_MODES.map((option) => (
          <OnboardingSelectableCard
            key={option.id}
            iconName={option.iconName}
            iconBadgeSize="lg"
            label={t(`options.${option.id}.label`)}
            description={t(`options.${option.id}.description`)}
            selected={selectedMode === option.id}
            onSelect={() => onSelect(option.id)}
          />
        ))}
      </div>
    </fieldset>
  );
}
