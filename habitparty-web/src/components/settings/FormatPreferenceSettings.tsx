"use client";

import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { DATE_FORMAT_OPTIONS, TIME_FORMAT_OPTIONS } from "@/constants/settings";
import { useDateFormat } from "@/hooks/useDateFormat";
import { useTimeFormat } from "@/hooks/useTimeFormat";
import { useUIStore } from "@/store/uiStore";
import type { SettingsOptionItem } from "@/types/settings";
import type { DateFormat, TimeFormat } from "@/types/ui";
import { SettingsOptionGrid } from "./SettingsOptionGrid";

interface FormatOptionMeta<T extends string> {
  value: T;
  i18nPrefix: string;
  statusKey: string;
  icon?: LucideIcon;
}

interface FormatPreferenceSectionProps<T extends string> {
  namespace: "settings.dateFormatCard" | "settings.timeFormatCard";
  optionList: readonly FormatOptionMeta<T>[];
  currentValue: T;
  onSelectValue: (nextValue: T) => void;
}

function FormatPreferenceSection<T extends string>({
  namespace,
  optionList,
  currentValue,
  onSelectValue,
}: FormatPreferenceSectionProps<T>) {
  const t = useTranslations(namespace);

  const options: SettingsOptionItem<T>[] = optionList.map((opt) => ({
    value: opt.value,
    title: t(`${opt.i18nPrefix}Label` as never),
    description: t(`${opt.i18nPrefix}Desc` as never),
    badge: t(`${opt.i18nPrefix}Example` as never),
    icon: opt.icon,
  }));

  const activeConfig =
    optionList.find((opt) => opt.value === currentValue) ?? optionList[0];

  const statusMessage = (
    <>
      <span className="font-bold">{t("activeLabel")}</span>
      {t(activeConfig.statusKey as never)}
    </>
  );

  return (
    <SettingsOptionGrid
      statusMessage={statusMessage}
      options={options}
      selectedValue={currentValue}
      onSelect={(nextValue) => {
        if (nextValue !== currentValue) {
          onSelectValue(nextValue);
        }
      }}
    />
  );
}

interface FormatPreferenceSettingsProps {
  kind: "date" | "time";
  initialDateFormat?: DateFormat;
  initialTimeFormat?: TimeFormat;
}

export function FormatPreferenceSettings({
  kind,
  initialDateFormat,
  initialTimeFormat,
}: FormatPreferenceSettingsProps) {
  const hydrated = useUIStore((s) => s.hydrated);
  const { dateFormat, setDateFormat } = useDateFormat();
  const { timeFormat, setTimeFormat } = useTimeFormat();

  if (kind === "date") {
    const currentValue = hydrated
      ? dateFormat
      : (initialDateFormat ?? dateFormat);
    return (
      <FormatPreferenceSection
        namespace="settings.dateFormatCard"
        optionList={DATE_FORMAT_OPTIONS}
        currentValue={currentValue}
        onSelectValue={setDateFormat}
      />
    );
  }

  const currentValue = hydrated
    ? timeFormat
    : (initialTimeFormat ?? timeFormat);
  return (
    <FormatPreferenceSection
      namespace="settings.timeFormatCard"
      optionList={TIME_FORMAT_OPTIONS}
      currentValue={currentValue}
      onSelectValue={setTimeFormat}
    />
  );
}
