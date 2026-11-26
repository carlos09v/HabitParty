"use client";

import { Calendar } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ChangeEvent, useEffect, useState } from "react";
import { DatePicker } from "@/components/ui/DatePicker";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { NumberStepperInput } from "@/components/ui/NumberStepperInput";
import { Select } from "@/components/ui/Select";
import {
  DAILY_MONTHLY_OPTIONS,
  DAILY_REPEAT_OPTIONS,
  DAYS_OF_WEEK_OPTIONS,
} from "@/constants/task";
import type { CreateTaskFormReturn } from "@/hooks/useCreateTaskForm";
import type {
  DailyRepeatMonthlyOption,
  DailyRepeatTypeOption,
} from "@/types/task";
import { cn } from "@/utils";

interface DailyFieldsProps {
  form: CreateTaskFormReturn;
}

export function DailyFields({ form }: DailyFieldsProps) {
  const t = useTranslations("tasks.taskModal.dailyFields");
  const tOptions = useTranslations("tasks.options");
  const {
    startDate,
    setStartDate,
    repeatType,
    setRepeatType,
    repeatEvery,
    setRepeatEvery,
    selectedDays,
    toggleDayOfWeek,
    monthlyOption,
    setMonthlyOption,
    isPending,
  } = form;

  const intervalUnitLabel = t(`units.${repeatType}`);
  const [intervalInput, setIntervalInput] = useState(String(repeatEvery));

  useEffect(() => {
    setIntervalInput(String(repeatEvery));
  }, [repeatEvery]);

  const clampInterval = (value: number) =>
    Math.min(365, Math.max(1, Math.round(value)));

  const handleIntervalStep = (delta: number) => {
    const next = clampInterval(repeatEvery + delta);
    setRepeatEvery(next);
    setIntervalInput(String(next));
  };

  const handleIntervalChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "") {
      setIntervalInput("");
      return;
    }
    const digitsOnly = raw.replace(/\D/g, "");
    setIntervalInput(digitsOnly);
    if (digitsOnly !== "") {
      const parsed = Number.parseInt(digitsOnly, 10);
      if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= 365) {
        setRepeatEvery(parsed);
      }
    }
  };

  const handleIntervalBlur = () => {
    const parsed = Number.parseInt(intervalInput, 10);
    const clamped = Number.isNaN(parsed) ? 1 : clampInterval(parsed);
    setRepeatEvery(clamped);
    setIntervalInput(String(clamped));
  };

  return (
    <div className="flex flex-col gap-3.5 animate-in fade-in duration-150">
      {/* Data Inicial */}
      <DatePicker
        id="dailyStart"
        label={t("startDateLabel")}
        value={startDate}
        disabled={isPending}
        onChange={setStartDate}
        placeholder={t("startDatePlaceholder")}
        compact
      />

      {/* Repetição & Intervalo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select
          label={t("repeatLabel")}
          options={DAILY_REPEAT_OPTIONS.map((opt) => ({
            value: opt.id,
            label: tOptions(`repeats.${opt.id}`),
          }))}
          value={repeatType}
          onChange={(val) => setRepeatType(val as DailyRepeatTypeOption)}
          disabled={isPending}
          compact
        />

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="dailyInterval"
            className="text-body-s text-neutral-300 font-medium"
          >
            {t("everyLabel", { unit: intervalUnitLabel })}
          </label>
          <NumberStepperInput
            id="dailyInterval"
            inputMode="numeric"
            min={1}
            max={365}
            value={intervalInput}
            disabled={isPending}
            onChange={handleIntervalChange}
            onBlur={handleIntervalBlur}
            stepAmount={1}
            onStep={handleIntervalStep}
            decrementDisabled={isPending || repeatEvery <= 1}
            incrementDisabled={isPending || repeatEvery >= 365}
            decrementAriaLabel={t("decreaseIntervalAria", {
              unit: intervalUnitLabel,
            })}
            incrementAriaLabel={t("increaseIntervalAria", {
              unit: intervalUnitLabel,
            })}
            iconSize={15}
            className="h-9.5 text-center font-bold"
          />
        </div>
      </div>

      {/* Regra de Repetição Mensal (Apenas se Mensalmente) */}
      {repeatType === "MONTHLY" && (
        <Select
          label={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-1.5">
                <span className="text-body-s text-neutral-300 font-medium">
                  {t("repeatOnLabel")}
                </span>
                <InfoTooltip
                  title={t("monthlyTooltipTitle")}
                  icon={<Calendar size={14} className="text-gold shrink-0" />}
                  ariaLabel={t("monthlyTooltipAria")}
                  size={14}
                >
                  <p className="text-neutral-300 leading-relaxed text-label-g">
                    {t("monthlyTooltipIntro")}
                  </p>

                  <ul className="flex flex-col gap-1.5 py-1 text-label-g text-neutral-200">
                    <li className="flex items-start gap-1.5">
                      <span className="text-gold font-bold shrink-0">
                        {t("monthlyDayOfMonthLabel")}
                      </span>
                      <span className="text-neutral-300">
                        {t("monthlyDayOfMonthDesc")}
                      </span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-gold font-bold shrink-0">
                        {t("monthlyDayOfWeekLabel")}
                      </span>
                      <span className="text-neutral-300">
                        {t("monthlyDayOfWeekDesc")}
                      </span>
                    </li>
                  </ul>

                  <div className="text-tiny text-neutral-400 bg-white/5 rounded-md p-1.5 border border-white/10 italic">
                    {t("monthlyNote")}
                  </div>
                </InfoTooltip>
              </div>
            </div>
          }
          options={DAILY_MONTHLY_OPTIONS.map((opt) => ({
            value: opt.id,
            label: t(`monthlyOptions.${opt.id}`),
          }))}
          value={monthlyOption}
          onChange={(val) => setMonthlyOption(val as DailyRepeatMonthlyOption)}
          disabled={isPending}
          compact
        />
      )}

      {/* Dias da Semana (Apenas se Semanalmente) */}
      {repeatType === "WEEKLY" && (
        <div className="flex flex-col gap-1.5 animate-in fade-in duration-150">
          <span className="text-body-s text-neutral-300 font-medium">
            {t("daysOfWeekLabel")}
          </span>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 sm:gap-1">
            {DAYS_OF_WEEK_OPTIONS.map((day) => {
              const isSelected = selectedDays.includes(day.id);
              return (
                <button
                  key={day.id}
                  type="button"
                  aria-pressed={isSelected}
                  disabled={isPending}
                  onClick={() => toggleDayOfWeek(day.id)}
                  className={cn(
                    "min-h-8 sm:min-h-0 py-1.5 px-0.5 rounded-lg border text-tiny font-bold transition-colors cursor-pointer disabled:opacity-50 text-center flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                    isSelected
                      ? "border-primary bg-primary text-white shadow-xs dark:border-gold dark:bg-gold dark:text-on-gold dark:shadow-glow-gold-xs font-black"
                      : "border-neutral-600 bg-card text-neutral-200 hover:border-primary/50 hover:text-primary dark:border-primary/30 dark:bg-primary-dark/20 dark:text-neutral-300 dark:hover:text-gold dark:hover:border-gold/40",
                  )}
                >
                  {t(`days.${day.id}`)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
