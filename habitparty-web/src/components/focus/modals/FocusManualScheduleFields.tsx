import { Clock, Flame, Minus, Moon, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId } from "react";
import { DatePicker } from "@/components/ui/DatePicker";
import { DurationHoursBadge } from "@/components/ui/DurationHoursBadge";
import { NumberStepperInput } from "@/components/ui/NumberStepperInput";
import { TimePicker } from "@/components/ui/TimePicker";
import {
  FOCUS_MANUAL_PRESETS,
  MAX_MANUAL_FOCUS_MINUTES,
} from "@/constants/focusRules";
import type { ManualRecordFieldErrors } from "@/hooks/useFocusManualSubmission";
import { useTimeFormat } from "@/hooks/useTimeFormat";
import type { FocusRecordType } from "@/types/focus";
import { cn } from "@/utils";
import { formatTimeDisplay } from "@/utils/date";

interface FocusManualScheduleFieldsProps {
  isEditMode: boolean;
  isItemMode: boolean;
  recordType: FocusRecordType;
  selectedItemMinutes: number;
  durationMinutes: number;
  durationInput: string;
  onDurationInputChange: (raw: string) => void;
  onDurationStep: (delta: number) => void;
  onPresetSelect: (minutes: number) => void;
  completedPomos: number;
  onCompletedPomosStep: (delta: number) => void;
  sessionDate: string;
  maxDate: string;
  onSessionDateChange: (date: string) => void;
  startTimeStr: string;
  endTimeStr: string;
  crossesMidnight: boolean;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
  fieldErrors: ManualRecordFieldErrors;
}

/**
 * Coluna direita do modal de registro manual: duração, presets rápidos, ciclos Pomodoro,
 * data, janela início/fim (respeitando 12h/24h) e indicador de travessia de meia-noite.
 */
export function FocusManualScheduleFields({
  isEditMode,
  isItemMode,
  recordType,
  selectedItemMinutes,
  durationMinutes,
  durationInput,
  onDurationInputChange,
  onDurationStep,
  onPresetSelect,
  completedPomos,
  onCompletedPomosStep,
  sessionDate,
  maxDate,
  onSessionDateChange,
  startTimeStr,
  endTimeStr,
  crossesMidnight,
  onStartTimeChange,
  onEndTimeChange,
  fieldErrors,
}: FocusManualScheduleFieldsProps) {
  const t = useTranslations("focus.manualRecord");
  const { timeFormat } = useTimeFormat();
  const durationHoursHintId = useId();

  const minPomos = isEditMode ? 0 : 1;
  const averageMinutesPerPomo =
    completedPomos > 0
      ? Math.floor(durationMinutes / completedPomos)
      : durationMinutes;

  const maxDurationMinutes = isItemMode
    ? selectedItemMinutes > 0
      ? selectedItemMinutes
      : undefined
    : MAX_MANUAL_FOCUS_MINUTES;

  const durationPresets = isItemMode
    ? FOCUS_MANUAL_PRESETS.filter(
        (mins) => selectedItemMinutes <= 0 || mins <= selectedItemMinutes,
      )
    : FOCUS_MANUAL_PRESETS;

  const formattedStartTime = formatTimeDisplay(startTimeStr, { timeFormat });
  const formattedEndTime = formatTimeDisplay(endTimeStr, { timeFormat });

  return (
    <div className="p-3.5 rounded-xl border border-neutral-700 bg-background dark:border-primary/25 dark:bg-primary-dark/15 flex flex-col justify-between gap-3">
      <div className="flex flex-col gap-3">
        {/* Cabeçalho de Duração + Presets rápidos */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-body-s text-neutral-100 font-semibold flex items-center gap-1.5">
            <Clock
              size={14}
              className="text-primary dark:text-gold"
              aria-hidden="true"
            />
            {t("focusTimeLabel")}
          </span>
          <fieldset
            aria-label={t("durationPresetsAria")}
            className="flex items-center gap-1 border-0 p-0 m-0"
          >
            {durationPresets.map((mins) => (
              <button
                key={mins}
                type="button"
                aria-pressed={durationMinutes === mins}
                onClick={() => onPresetSelect(mins)}
                className={cn(
                  "min-h-6 px-2 py-0.5 rounded-md text-tiny font-semibold border transition-colors cursor-pointer",
                  durationMinutes === mins
                    ? "bg-amber-500/20 border-amber-500 text-amber-800 dark:bg-gold/25 dark:border-gold dark:text-gold font-bold shadow-glow-gold-xs"
                    : "bg-card dark:bg-surface/60 border-neutral-600 dark:border-primary/25 text-neutral-400 hover:text-amber-700 dark:hover:text-gold hover:border-amber-500/40 dark:hover:border-gold/40",
                )}
              >
                {mins}m
              </button>
            ))}
          </fieldset>
        </div>

        {/* Linha com Minutos Totais / A Deduzir e Stepper de Ciclos */}
        <div
          className={cn(
            "grid gap-2.5 items-start",
            !isItemMode && recordType === "POMO"
              ? "grid-cols-1 sm:grid-cols-2"
              : "grid-cols-1",
          )}
        >
          <div className="flex flex-col gap-1.5">
            <NumberStepperInput
              id="duration-minutes"
              label={
                isItemMode
                  ? t("durationToDeductLabel", {
                      minutes: selectedItemMinutes,
                    })
                  : t("totalMinutesLabel")
              }
              compact
              min={0}
              max={maxDurationMinutes}
              value={durationInput}
              onChange={(e) => onDurationInputChange(e.target.value)}
              onStep={onDurationStep}
              decrementDisabled={durationMinutes <= 1}
              incrementDisabled={
                maxDurationMinutes !== undefined &&
                durationMinutes >= maxDurationMinutes
              }
              icon={<Clock size={16} aria-hidden="true" />}
              iconSize={13}
              error={fieldErrors.duration}
              aria-describedby={
                durationMinutes >= 60 ? durationHoursHintId : undefined
              }
              className="font-bold"
            />
            <DurationHoursBadge
              id={durationHoursHintId}
              minutes={durationMinutes}
            />
          </div>

          {!isItemMode && recordType === "POMO" && (
            <div className="flex flex-col gap-1.5">
              <span
                id="pomo-stepper-label"
                className="font-medium text-neutral-100 select-none text-body-s flex items-center justify-between"
              >
                <span className="flex items-center gap-1">
                  <Flame
                    size={13}
                    className="text-orange-800 dark:text-gold"
                    aria-hidden="true"
                  />
                  {t("cyclesLabel")}
                </span>
                <span className="text-tiny text-neutral-400 font-normal">
                  {t("avgMinutesPerCycle", {
                    minutes: averageMinutesPerPomo,
                  })}
                </span>
              </span>

              <fieldset
                aria-labelledby="pomo-stepper-label"
                className="m-0 flex items-center justify-between py-1 px-1.5 rounded-lg border border-neutral-600 bg-card shadow-xs dark:bg-primary-dark/20 dark:border-primary/30 dark:shadow-none"
              >
                <button
                  type="button"
                  onClick={() => onCompletedPomosStep(-1)}
                  disabled={completedPomos <= minPomos}
                  className="min-w-7 min-h-7 pointer-coarse:min-w-9 pointer-coarse:min-h-9 flex items-center justify-center rounded-md text-neutral-400 hover:text-primary dark:hover:text-gold hover:bg-neutral-700/50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  aria-label={t("decreaseCyclesAria")}
                >
                  <Minus size={14} aria-hidden="true" />
                </button>

                <span className="text-body-s font-bold text-neutral-100 tabular-nums">
                  {t("cyclesCount", { count: completedPomos })}
                </span>

                <button
                  type="button"
                  onClick={() => onCompletedPomosStep(1)}
                  disabled={completedPomos >= 50}
                  className="min-w-7 min-h-7 pointer-coarse:min-w-9 pointer-coarse:min-h-9 flex items-center justify-center rounded-md text-neutral-400 hover:text-primary dark:hover:text-gold hover:bg-neutral-700/50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  aria-label={t("increaseCyclesAria")}
                >
                  <Plus size={14} aria-hidden="true" />
                </button>
              </fieldset>
            </div>
          )}
        </div>

        {isItemMode && (
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-card dark:bg-white/5 border border-neutral-700 dark:border-white/10 text-label-m text-neutral-300">
            <span>{t("remainingBalanceAfterLog")}</span>
            <strong className="text-amber-700 dark:text-gold font-semibold tabular-nums">
              {Math.max(0, selectedItemMinutes - durationMinutes)}m
            </strong>
          </div>
        )}

        {/* Divisor sutil integrando Data e Janela de Horário apenas para Atividades */}
        {!isItemMode && (
          <div className="border-t border-neutral-700 dark:border-white/10 pt-3 flex flex-col gap-2.5">
            <DatePicker
              id="session-date"
              label={t("sessionDateLabel")}
              value={sessionDate}
              onChange={onSessionDateChange}
              maxDate={maxDate}
              placeholder={t("todayPlaceholder")}
              error={fieldErrors.sessionDate}
              compact
              allowClear={false}
              align="left"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-start">
              <TimePicker
                id="session-start-time"
                label={t("startTimeLabel")}
                value={startTimeStr}
                onChange={onStartTimeChange}
                compact
                align="left"
              />

              <TimePicker
                id="session-end-time"
                label={t("endTimeLabel")}
                value={endTimeStr}
                onChange={onEndTimeChange}
                error={fieldErrors.endTime}
                compact
                align="right"
              />
            </div>
          </div>
        )}
      </div>

      {/* Resumo sincronizado compacto na base do painel de tempo (respeita 12h/24h e meia-noite) */}
      {!isItemMode && (
        <div className="flex flex-col gap-1.5 px-2.5 py-1.5 rounded-lg bg-card dark:bg-white/5 border border-neutral-700 dark:border-white/10 text-tiny text-neutral-300">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>{t("syncedWindowLabel")}</span>
            <strong className="text-amber-700 dark:text-gold font-semibold tabular-nums">
              {t("syncedWindowSummary", {
                start: formattedStartTime,
                end: formattedEndTime,
                minutes: durationMinutes,
              })}
            </strong>
          </div>
          {crossesMidnight && (
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-indigo-700 dark:text-indigo-300">
              <Moon size={11} className="shrink-0" aria-hidden="true" />
              <span>{t("crossesMidnightBadge")}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
