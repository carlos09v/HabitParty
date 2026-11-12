"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { TIME_FORMAT_OPTIONS } from "@/constants/settings";
import { useTimeFormat } from "@/hooks/useTimeFormat";
import type { SettingsOptionItem } from "@/types/settings";
import type { TimeFormat } from "@/types/ui";
import { SettingsOptionGrid } from "./SettingsOptionGrid";

export function TimeFormatSettings() {
  const t = useTranslations("settings.timeFormatCard");
  const { timeFormat, setTimeFormat } = useTimeFormat();

  const options: SettingsOptionItem<TimeFormat>[] = TIME_FORMAT_OPTIONS.map(
    (opt) => ({
      value: opt.value,
      title: t(`${opt.i18nPrefix}Label`),
      description: t(`${opt.i18nPrefix}Desc`),
      badge: t(`${opt.i18nPrefix}Example`),
      icon: opt.icon,
    }),
  );

  const activeConfig =
    TIME_FORMAT_OPTIONS.find((o) => o.value === timeFormat) ??
    TIME_FORMAT_OPTIONS[0];

  const statusMessage = (
    <>
      <span className="font-bold">{t("activeLabel")}</span>
      {t(activeConfig.statusKey)}
    </>
  );

  const handleSelect = (format: TimeFormat) => {
    if (format === timeFormat) return;
    setTimeFormat(format);
    toast.success(t("toastSuccess", { format }));
  };

  return (
    <SettingsOptionGrid
      statusMessage={statusMessage}
      options={options}
      selectedValue={timeFormat}
      onSelect={handleSelect}
    />
  );
}
