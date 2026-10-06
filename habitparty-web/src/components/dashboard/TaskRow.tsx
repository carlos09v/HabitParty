import {
  Check,
  Coins,
  Flame,
  Minus,
  MoreHorizontal,
  Plus,
  Sparkles,
} from "lucide-react";
import {
  getTaskBorderClass,
  normalizeTaskType,
  TASK_TYPE_META,
  WEEK_DAYS,
} from "@/constants/task";
import { useCompactMode } from "@/hooks/useCompactMode";
import { useTaskProgress } from "@/hooks/useTaskProgress";
import type { TaskRowProps } from "@/types/task";
import { cn } from "@/utils";

export function TaskRow({ task, onToggle, onHabitChange }: TaskRowProps) {
  const { isCompact } = useCompactMode();
  const { completed, habitScore, toggleCompleted, changeHabit, isDone } =
    useTaskProgress(task, {
      onToggle,
      onHabitChange,
    });

  const taskType = normalizeTaskType(task);
  const isHabit = taskType === "habit";
  const isDaily = taskType === "daily";
  const isTodo = taskType === "todo";

  const typeInfo = TASK_TYPE_META[taskType] || TASK_TYPE_META.todo;
  const borderClass = getTaskBorderClass(task);

  // Regra fundamental: Ícone de streak (chama) NUNCA é exibido em Afazeres (To-Do)
  const showStreak =
    !isTodo && typeof task.streak === "number" && task.streak > 0;

  return (
    <div
      className={cn(
        "grid grid-cols-[minmax(0,2.5fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,1.5fr)_36px] items-center rounded-lg border transition-all",
        isCompact ? "gap-3 px-3 py-2" : "gap-4 px-4 py-3",
        "bg-primary-dark/20 border border-primary/30 hover:border-y-primary-light/40 hover:border-r-primary-light/40 hover:bg-primary-dark/30",
        borderClass,
        "border-l-4",
        isDone && "opacity-60",
      )}
    >
      {/* Coluna 1: Ação + Título + Metadados (Streak, Recompensas e Saldo) */}
      <div className="flex items-center gap-2.5 min-w-0">
        {isHabit ? (
          <div className="flex items-center gap-1 shrink-0">
            {(task.habitType === "POSITIVE" ||
              task.habitType === "BOTH" ||
              !task.habitType) && (
              <button
                type="button"
                onClick={() => changeHabit(1)}
                title="Registrar hábito positivo (+)"
                className={cn(
                  "rounded bg-success-500/20 border border-success-500/40 text-success-500 hover:bg-success-500 hover:text-neutral-900 flex items-center justify-center font-bold transition-all cursor-pointer shadow-xs active:scale-95",
                  isCompact ? "w-4.5 h-4.5" : "w-5.5 h-5.5",
                )}
              >
                <Plus size={13} className="stroke-3" />
              </button>
            )}
            {(task.habitType === "NEGATIVE" || task.habitType === "BOTH") && (
              <button
                type="button"
                onClick={() => changeHabit(-1)}
                title="Registrar hábito negativo (-)"
                className={cn(
                  "rounded bg-danger-500/20 border border-danger-500/40 text-danger-500 hover:bg-danger-500 hover:text-neutral-100 flex items-center justify-center font-bold transition-all cursor-pointer shadow-xs active:scale-95",
                  isCompact ? "w-4.5 h-4.5" : "w-5.5 h-5.5",
                )}
              >
                <Minus size={13} className="stroke-3" />
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={toggleCompleted}
            aria-label={
              completed ? "Marcar como pendente" : "Marcar como concluída"
            }
            className={cn(
              "rounded-md border flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95",
              isCompact ? "w-4 h-4" : "w-5 h-5",
              completed
                ? "bg-gold border-gold text-neutral-900 shadow-[0_0_8px_rgba(237,229,57,0.4)]"
                : "border-primary/50 bg-primary-dark/40 hover:border-gold",
            )}
          >
            {completed && <Check size={13} className="stroke-3" />}
          </button>
        )}

        <div className="flex flex-col min-w-0">
          <span
            className={cn(
              "font-medium text-neutral-100 truncate",
              isCompact ? "text-xs" : "text-body-s",
              isDone && "line-through text-neutral-400",
            )}
          >
            {task.title}
          </span>

          <div className="flex items-center gap-2 text-label-g text-neutral-400">
            {/* Streak: NUNCA exibido em To-Do */}
            {showStreak && (
              <>
                <span
                  className="flex items-center gap-0.5 text-warning-500 font-bold"
                  title={`Ofensiva de ${task.streak} dia(s)`}
                >
                  <Flame
                    size={12}
                    className="fill-warning-500 text-warning-500"
                  />
                  {task.streak}
                </span>
                <span>•</span>
              </>
            )}

            {task.rewardXp !== undefined && (
              <>
                <span className="flex items-center gap-0.5 text-magenta font-medium">
                  <Sparkles size={11} /> +{task.rewardXp} XP
                </span>
                <span>•</span>
              </>
            )}

            {task.rewardGold !== undefined && (
              <span className="flex items-center gap-0.5 text-gold font-medium">
                <Coins size={11} /> +{task.rewardGold}
              </span>
            )}

            {isHabit && (
              <>
                <span>•</span>
                <span
                  className={cn(
                    "font-bold text-label-m px-1.5 py-0.5 rounded",
                    habitScore >= 0
                      ? "text-success-500 bg-success-500/10"
                      : "text-danger-500 bg-danger-500/10",
                  )}
                >
                  Saldo: {habitScore > 0 ? `+${habitScore}` : habitScore}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Coluna 2: Categoria / Coluna */}
      <div className="flex items-center">
        <span
          className={cn(
            "rounded font-medium bg-white/[0.06] border border-white/[0.1] text-neutral-200 truncate",
            isCompact ? "px-1.5 py-0.5 text-tiny" : "px-2 py-0.5 text-xs",
          )}
        >
          {task.category || "-"}
        </span>
      </div>

      {/* Coluna 3: Badge do Tipo */}
      <div className="flex items-center">
        <span
          className={cn(
            "rounded font-semibold border truncate shadow-xs uppercase tracking-wide",
            isCompact
              ? "px-1.5 py-0.5 text-label-s"
              : "px-2 py-0.5 text-label-m",
            typeInfo.color,
          )}
        >
          {typeInfo.label}
        </span>
      </div>

      {/* Coluna 4: Frequência / Prazo */}
      <div className="flex items-center min-w-0">
        {isDaily ? (
          <div
            className="flex items-center gap-0.5"
            title="Dias ativos da semana"
          >
            {WEEK_DAYS.map((day) => {
              const isActive =
                !task.daysOfWeek || task.daysOfWeek.length === 0
                  ? true
                  : task.daysOfWeek.includes(day.enumValue);
              return (
                <span
                  key={day.enumValue}
                  title={`${day.fullName}: ${isActive ? "Ativo" : "Inativo"}`}
                  className={cn(
                    "rounded-full flex items-center justify-center font-bold transition-all",
                    isCompact ? "w-4 h-4 text-[8px]" : "w-4.5 h-4.5 text-[9px]",
                    isActive
                      ? "bg-gold text-neutral-900 shadow-glow-gold-xs font-extrabold"
                      : "bg-white/5 text-neutral-500 border border-white/5",
                  )}
                >
                  {day.shortLabel}
                </span>
              );
            })}
          </div>
        ) : isTodo ? (
          <span className="text-body-s text-neutral-300 font-medium truncate">
            {task.dueDate || "Sem prazo"}
          </span>
        ) : (
          <span className="text-body-s text-neutral-400 font-medium truncate">
            {task.resetCounter === "DAILY"
              ? "Diário"
              : task.resetCounter === "WEEKLY"
                ? "Semanal"
                : task.resetCounter === "MONTHLY"
                  ? "Mensal"
                  : "Contínuo"}
          </span>
        )}
      </div>

      {/* Coluna 5: Ações */}
      <div className="flex items-center justify-end">
        <button
          type="button"
          aria-label="Mais opções da tarefa"
          className="p-1 rounded text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.08] transition-colors cursor-pointer"
        >
          <MoreHorizontal size={16} />
        </button>
      </div>
    </div>
  );
}
