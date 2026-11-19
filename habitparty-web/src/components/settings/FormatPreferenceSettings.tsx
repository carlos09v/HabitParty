"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { DATE_FORMAT_OPTIONS, TIME_FORMAT_OPTIONS } from "@/constants/settings";
import { useDateFormat } from "@/hooks/useDateFormat";
import { useTimeFormat } from "@/hooks/useTimeFormat";
import type { SettingsOptionItem } from "@/types/settings";
import type { DateFormat, TimeFormat } from "@/types/ui";
import { SettingsOptionGrid } from "./SettingsOptionGrid";

interface FormatPreferenceSettingsProps {
  kind: "date" | "time";
}

export function FormatPreferenceSettings({
  kind,
}: FormatPreferenceSettingsProps) {
  const isDate = kind === "date";
  const t = useTranslations(
    isDate ? "settings.dateFormatCard" : "settings.timeFormatCard",
  );
  const { dateFormat, setDateFormat } = useDateFormat();
  const { timeFormat, setTimeFormat } = useTimeFormat();

  const rawOptions = isDate ? DATE_FORMAT_OPTIONS : TIME_FORMAT_OPTIONS;
  const currentValue: DateFormat | TimeFormat = isDate
    ? dateFormat
    : timeFormat;

  const options: SettingsOptionItem<DateFormat | TimeFormat>[] = rawOptions.map(
    (opt) => ({
      value: opt.value,
      title: t(`${opt.i18nPrefix}Label`),
      description: t(`${opt.i18nPrefix}Desc`),
      badge: t(`${opt.i18nPrefix}Example`),
      icon: opt.icon,
    }),
  );

  const activeConfig =
    rawOptions.find((opt) => opt.value === currentValue) ?? rawOptions[0];

  const statusMessage = (
    <>
      <span className="font-bold">{t("activeLabel")}</span>
      {t(activeConfig.statusKey)}
    </>
  );

  const handleSelect = (nextValue: DateFormat | TimeFormat) => {
    if (nextValue === currentValue) return;
    if (isDate) {
      setDateFormat(nextValue as DateFormat);
    } else {
      setTimeFormat(nextValue as TimeFormat);
    }
    toast.success(t("toastSuccess", { format: nextValue }));
  };

  return (
    <SettingsOptionGrid
      statusMessage={statusMessage}
      options={options}
      selectedValue={currentValue}
      onSelect={handleSelect}
    />
  );
}
