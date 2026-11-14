"use client";

import {
  AlertTriangle,
  BellRing,
  Calendar,
  Flame,
  Lock,
  ShieldAlert,
  Zap,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { Switch } from "@/components/ui/Switch";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { AppLocale } from "@/i18n/config";
import { useUIStore } from "@/store/uiStore";
import { useUserStore } from "@/store/userStore";
import { cn } from "@/utils";
import { formatTimeDisplay, getTaskDueDateInfo } from "@/utils/date";

interface HardcoreModeToggleProps {
  isHardcore: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  taskType?: "HABIT" | "DAILY" | "TODO" | string;
  dueDate?: string;
  dueTime?: string;
  startTime?: string;
  dueEndTime?: string;
  isAllDay?: boolean;
}

export function HardcoreModeToggle({
  isHardcore,
  onChange,
  disabled = false,
  taskType,
  dueDate,
  dueTime,
  startTime,
  dueEndTime,
  isAllDay = false,
}: HardcoreModeToggleProps) {
  const t = useTranslations("tasks.taskModal.hardcore");
  const locale = useLocale() as AppLocale;
  const timeFormat = useUIStore((s) => s.timeFormat);
  const userTimeZone = useUserStore((s) => s.user?.timezone);
  const { isGamified } = useExperienceMode();
  const isTodo = (taskType || "").toUpperCase() === "TODO";
  const isTodoEvent = Boolean(isTodo && (isAllDay || startTime || dueEndTime));

  const todoDueInfo = isTodo
    ? getTaskDueDateInfo(dueDate, {
        locale,
        dueTime,
        startTime,
        dueEndTime,
        isAllDay,
        timeFormat,
        timeZone: userTimeZone,
      })
    : null;
  const isTodoOverdue = Boolean(todoDueInfo?.isOverdue);
  const deadlineTimeDisplay =
    todoDueInfo?.endTime ??
    (!isAllDay && !startTime && dueTime
      ? formatTimeDisplay(dueTime.slice(0, 5), { timeFormat, locale })
      : null);

  const todoPenaltyDescription = isTodoOverdue
    ? isTodoEvent
      ? t("todoPenaltyEventOverdueDesc")
      : t("todoPenaltyOverdueDesc")
    : deadlineTimeDisplay
      ? t("todoPenaltyWithTimeDesc", { time: deadlineTimeDisplay })
      : isTodoEvent
        ? t("todoPenaltyEventDesc")
        : t("todoPenaltyDesc");

  const todoActiveAlertText = isTodoOverdue
    ? t("todoActiveOverdueAlert")
    : t("todoActiveAlert");

  const title = isGamified
    ? t("title")
    : isTodo
      ? t("todoTitleProductivity")
      : t("routineTitleProductivity");
  const tooltipTitle = isTodo
    ? isGamified
      ? t("todoTooltipTitle")
      : t("todoTooltipTitleProductivity")
    : isGamified
      ? t("routineTooltipTitle")
      : t("routineTooltipTitleProductivity");
  const subtitle = isTodo
    ? isGamified
      ? t("todoSubtitle")
      : t("todoSubtitleProductivity")
    : isGamified
      ? t("routineSubtitle")
      : t("routineSubtitleProductivity");

  return (
    <div className="flex flex-col gap-2 pt-2 border-t border-white/10 mt-auto">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-body-s font-semibold text-neutral-100">
              {title}
            </span>

            <InfoTooltip
              title={tooltipTitle}
              icon={<Zap size={14} className="fill-gold text-gold" />}
              ariaLabel={t("tooltipAria")}
            >
              {isTodo ? (
                <>
                  <p className="text-neutral-300 leading-relaxed text-label-g">
                    {t.rich("todoIntro", {
                      bold: (chunks) => <strong>{chunks}</strong>,
                    })}
                  </p>

                  <ul className="flex flex-col gap-1.5 py-1 text-label-g text-neutral-200">
                    <li className="flex items-start gap-1.5">
                      <span className="text-gold font-bold shrink-0 flex items-center gap-1">
                        <Lock size={12} className="shrink-0" />{" "}
                        {t("todoNoSelfSabotageTitle")}
                      </span>
                      <span className="text-neutral-300">
                        {t("todoNoSelfSabotageDesc")}
                      </span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-amber-400 font-bold shrink-0 flex items-center gap-1">
                        <BellRing size={12} className="shrink-0" />{" "}
                        {t("todoCriticalAlertTitle")}
                      </span>
                      <span className="text-neutral-300">
                        {t("todoCriticalAlertDesc")}
                      </span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-danger-400 font-bold shrink-0">
                        {isGamified
                          ? t("todoPenaltyTitle")
                          : t("todoPenaltyTitleProductivity")}
                      </span>
                      <span className="text-neutral-300">
                        {todoPenaltyDescription}
                      </span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-neutral-400 font-bold shrink-0 flex items-center gap-1">
                        <Calendar size={12} className="shrink-0" />{" "}
                        {t("todoLateDeliveryTitle")}
                      </span>
                      <span className="text-neutral-300">
                        {t("todoLateDeliveryDesc")}
                      </span>
                    </li>
                  </ul>

                  <div className="text-tiny text-neutral-300 bg-white/5 rounded-md p-2 border border-white/10">
                    <strong className="text-gold block mb-0.5">
                      {t("whenToActivateTitle")}
                    </strong>
                    {t("todoWhenToActivateDesc")}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-neutral-300 leading-relaxed text-label-g">
                    {t.rich("routineIntro", {
                      bold: (chunks) => <strong>{chunks}</strong>,
                    })}
                  </p>

                  <ul className="flex flex-col gap-1.5 py-1 text-label-g text-neutral-200">
                    <li className="flex items-start gap-1.5">
                      <span className="text-gold font-bold shrink-0 flex items-center gap-1">
                        <ShieldAlert size={12} className="shrink-0" />{" "}
                        {t("routinePriorityFocusTitle")}
                      </span>
                      <span className="text-neutral-300">
                        {t("routinePriorityFocusDesc")}
                      </span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-danger-400 font-bold shrink-0">
                        {isGamified
                          ? t("routinePenaltyTitle")
                          : t("routinePenaltyTitleProductivity")}
                      </span>
                      <span className="text-neutral-300">
                        {t("routinePenaltyDesc")}
                      </span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-warning-400 font-bold shrink-0 flex items-center gap-1">
                        <Flame size={12} className="shrink-0" />{" "}
                        {t("routineZeroStreakTitle")}
                      </span>
                      <span className="text-neutral-300">
                        {t("routineZeroStreakDesc")}
                      </span>
                    </li>
                  </ul>

                  <div className="text-tiny text-neutral-300 bg-white/5 rounded-md p-2 border border-white/10">
                    <strong className="text-gold block mb-0.5">
                      {t("whenToActivateTitle")}
                    </strong>
                    {t("routineWhenToActivateDesc")}
                  </div>
                </>
              )}
            </InfoTooltip>
          </div>
          <span className="text-tiny text-neutral-400">{subtitle}</span>
        </div>

        <Switch
          checked={isHardcore}
          onCheckedChange={onChange}
          disabled={disabled}
          aria-label={t("switchAria")}
          className={cn(
            isHardcore &&
              "bg-danger-500 border-danger-500 shadow-[0_0_10px_rgba(251,44,54,0.5)]",
          )}
        />
      </div>

      {/* Alerta Contextual quando Hardcore está ativo */}
      {isHardcore && (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-danger-500/10 border border-danger-500/30 text-danger-400 text-tiny font-medium animate-in fade-in duration-200">
          <AlertTriangle size={13} className="shrink-0 text-danger-400" />
          <span>{isTodo ? todoActiveAlertText : t("routineActiveAlert")}</span>
        </div>
      )}
    </div>
  );
}
