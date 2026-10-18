"use client";

import { Calendar } from "lucide-react";
import { DatePicker } from "@/components/ui/DatePicker";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
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

  const intervalUnitLabel =
    repeatType === "WEEKLY"
      ? "semanas"
      : repeatType === "MONTHLY"
        ? "meses"
        : repeatType === "YEARLY"
          ? "anos"
          : "dias";

  return (
    <div className="flex flex-col gap-3.5 animate-in fade-in duration-150">
      {/* Data Inicial */}
      <DatePicker
        id="dailyStart"
        label="Data Inicial"
        value={startDate}
        disabled={isPending}
        onChange={setStartDate}
        placeholder="Definir data inicial..."
        compact
      />

      {/* Repetição & Intervalo */}
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Repetição"
          options={DAILY_REPEAT_OPTIONS.map((opt) => ({
            value: opt.id,
            label: opt.label,
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
            A cada ({intervalUnitLabel})
          </label>
          <input
            id="dailyInterval"
            type="number"
            min={1}
            max={365}
            value={repeatEvery}
            disabled={isPending}
            onChange={(e) =>
              setRepeatEvery(Math.max(1, Number(e.target.value)))
            }
            className="w-full bg-background/50 border border-primary/40 rounded-lg px-3 py-2 text-neutral-50 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors text-body-s font-bold"
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
                  Repetir no
                </span>
                <InfoTooltip
                  title="Regra de Repetição Mensal"
                  icon={<Calendar size={14} className="text-gold shrink-0" />}
                  ariaLabel="Entenda as opções de repetição mensal da tarefa"
                  size={14}
                >
                  <p className="text-neutral-300 leading-relaxed text-label-g">
                    Define como a nova data da tarefa será calculada a cada mês
                    após você concluí-la:
                  </p>

                  <ul className="flex flex-col gap-1.5 py-1 text-label-g text-neutral-200">
                    <li className="flex items-start gap-1.5">
                      <span className="text-gold font-bold shrink-0">
                        • No dia do mês:
                      </span>
                      <span className="text-neutral-300">
                        Repete sempre na mesma data numérica (ex: todo dia 15).
                        Ideal para contas, relatórios mensais e metas fixas.
                      </span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-gold font-bold shrink-0">
                        • No dia da semana:
                      </span>
                      <span className="text-neutral-300">
                        Mantém a posição relativa do dia na semana (ex: toda 2ª
                        Terça-feira do mês). Ideal para reuniões periódicas,
                        consultas ou rituais de calendário.
                      </span>
                    </li>
                  </ul>

                  <div className="text-tiny text-neutral-400 bg-white/5 rounded-md p-1.5 border border-white/10 italic">
                    💡 Ambas as opções respeitam o intervalo definido em &quot;A
                    cada (meses)&quot;.
                  </div>
                </InfoTooltip>
              </div>
            </div>
          }
          options={DAILY_MONTHLY_OPTIONS.map((opt) => ({
            value: opt.id,
            label: opt.label,
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
            Dias da semana
          </span>
          <div className="grid grid-cols-7 gap-1">
            {DAYS_OF_WEEK_OPTIONS.map((day) => {
              const isSelected = selectedDays.includes(day.id);
              return (
                <button
                  key={day.id}
                  type="button"
                  disabled={isPending}
                  onClick={() => toggleDayOfWeek(day.id)}
                  className={cn(
                    "py-1.5 px-0.5 rounded-lg border text-tiny font-bold transition-all cursor-pointer disabled:opacity-50 text-center flex items-center justify-center",
                    isSelected
                      ? "border-gold bg-gold text-neutral-900 shadow-glow-gold-xs font-black"
                      : "border-primary/30 bg-primary-dark/20 text-neutral-300 hover:text-gold hover:border-gold/40",
                  )}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
