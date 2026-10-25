import { Minus, Plus, RotateCcw } from "lucide-react";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { Select } from "@/components/ui/Select";
import { HABIT_RESET_OPTIONS } from "@/constants/task";
import type { CreateTaskFormReturn } from "@/hooks/useCreateTaskForm";
import type { ResetCounterOption } from "@/types/task";
import { cn } from "@/utils";

interface HabitFieldsProps {
  form: CreateTaskFormReturn;
}

export function HabitFields({ form }: HabitFieldsProps) {
  const { habitType, setHabitType, resetCounter, setResetCounter, isPending } =
    form;

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-150">
      {/* Tipo de Hábito (Positivo / Negativo / Ambos) */}
      <div className="flex flex-col gap-2">
        <span className="text-body-s text-neutral-300 font-medium">
          Direção do Hábito
        </span>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={() => setHabitType("POSITIVE")}
            className={cn(
              "flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg border text-body-s font-bold transition-all cursor-pointer disabled:opacity-50",
              habitType === "POSITIVE"
                ? "border-gold bg-gold/20 text-gold shadow-glow-gold-xs"
                : "border-primary/30 bg-primary-dark/20 text-neutral-300 hover:text-gold hover:border-gold/40",
            )}
          >
            <Plus size={16} />
            <span>Positivo</span>
          </button>

          <button
            type="button"
            disabled={isPending}
            onClick={() => setHabitType("NEGATIVE")}
            className={cn(
              "flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg border text-body-s font-bold transition-all cursor-pointer disabled:opacity-50",
              habitType === "NEGATIVE"
                ? "border-gold bg-gold/20 text-gold shadow-glow-gold-xs"
                : "border-primary/30 bg-primary-dark/20 text-neutral-300 hover:text-gold hover:border-gold/40",
            )}
          >
            <Minus size={16} />
            <span>Negativo</span>
          </button>

          <button
            type="button"
            disabled={isPending}
            onClick={() => setHabitType("BOTH")}
            className={cn(
              "flex items-center justify-center gap-1 py-2 px-2 rounded-lg border text-body-s font-bold transition-all cursor-pointer disabled:opacity-50",
              habitType === "BOTH"
                ? "border-gold bg-gold/20 text-gold shadow-glow-gold-xs"
                : "border-primary/30 bg-primary-dark/20 text-neutral-300 hover:text-gold hover:border-gold/40",
            )}
          >
            <span>+/- Ambos</span>
          </button>
        </div>
      </div>

      {/* Contador / Reset com Popover Informativo */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-neutral-100">
            Reiniciar Contador (Reset)
          </span>

          <InfoTooltip
            title="Frequência de Reinício do Contador"
            icon={<RotateCcw size={14} className="text-gold" />}
            ariaLabel="Entenda o que é o Reiniciar Contador"
            size={14}
          >
            <p className="text-neutral-300 leading-relaxed text-label-g">
              Define com que frequência os contadores de repetições (saldo +/-)
              voltam a zero para você reiniciar a contagem:
            </p>

            <ul className="flex flex-col gap-1.5 py-1 text-label-g text-neutral-200">
              <li className="flex items-start gap-1.5">
                <span className="text-gold font-bold shrink-0">• Diário:</span>
                <span className="text-neutral-300">
                  Zera todo dia à meia-noite (ex: beber água, treino diário).
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-gold font-bold shrink-0">• Semanal:</span>
                <span className="text-neutral-300">
                  Zera toda segunda-feira (ex: ir à academia 3x na semana).
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-gold font-bold shrink-0">• Mensal:</span>
                <span className="text-neutral-300">
                  Zera no dia 1º de cada mês (ex: ler 2 livros no mês).
                </span>
              </li>
            </ul>

            <div className="text-tiny text-neutral-400 bg-white/5 rounded-md p-1.5 border border-white/10 italic">
              🛡️ Sua ofensiva (Streak) e moedas acumuladas <strong>NÃO</strong>{" "}
              são perdidas quando o contador reinicia!
            </div>
          </InfoTooltip>
        </div>

        <Select
          options={HABIT_RESET_OPTIONS.map((opt) => ({
            value: opt.id,
            label: opt.label,
          }))}
          value={resetCounter}
          onChange={(val) => setResetCounter(val as ResetCounterOption)}
          disabled={isPending}
          compact
        />
      </div>
    </div>
  );
}
