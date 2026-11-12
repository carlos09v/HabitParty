"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { DATE_FORMAT_OPTIONS } from "@/constants/settings";
import { useDateFormat } from "@/hooks/useDateFormat";
import type { SettingsOptionItem } from "@/types/settings";
import type { DateFormat } from "@/types/ui";
import { SettingsOptionGrid } from "./SettingsOptionGrid";

interface DateFormatSettingsProps {
  isCompact?: boolean;
}

export function DateFormatSettings({
  isCompact = false,
}: DateFormatSettingsProps = {}) {
  const t = useTranslations("settings.dateFormatCard");
  const { dateFormat, setDateFormat } = useDateFormat();

  const options: SettingsOptionItem<DateFormat>[] = DATE_FORMAT_OPTIONS.map(
    (opt) => ({
      value: opt.value,
      title: t(`${opt.i18nPrefix}Label`),
      description: t(`${opt.i18nPrefix}Desc`),
      badge: t(`${opt.i18nPrefix}Example`),
      icon: opt.icon,
    }),
  );

  const activeConfig =
    DATE_FORMAT_OPTIONS.find((o) => o.value === dateFormat) ??
    DATE_FORMAT_OPTIONS[0];

  const statusMessage = (
    <>
      <span className="font-bold">{t("activeLabel")}</span>
      {t(activeConfig.statusKey)}
    </>
  );

  const handleSelect = (format: DateFormat) => {
    if (format === dateFormat) return;
    setDateFormat(format);
    toast.success(t("toastSuccess", { format }));
  };

  return (
    <SettingsOptionGrid
      statusMessage={statusMessage}
      options={options}
      selectedValue={dateFormat}
      onSelect={handleSelect}
      isCompact={isCompact}
    />
  );
}
