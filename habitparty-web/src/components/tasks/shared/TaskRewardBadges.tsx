import { Coins, Flame, Sparkles } from "lucide-react";
import { normalizeTaskType } from "@/constants/task";
import type { Task } from "@/types/task";
import { cn } from "@/utils";

interface TaskRewardBadgesProps {
  task: Task;
  isCompact?: boolean;
  showStreak?: boolean;
  showRewards?: boolean;
  className?: string;
}

/**
 * Exibe as recompensas (XP, Ouro) e Streak com regra centralizada.
 * Regra: Ícone de streak (chama 🔥) é exibido em Tarefas Diárias (Daily) e Hábitos (Habit) com streak ativo (> 0).
 * Afazeres (To-Do) possuem prazo e não possuem streak.
 * Recompensas numéricas de Gold/XP são opcionais (default false no card, para evitar poluição visual).
 */
export function TaskRewardBadges({
  task,
  isCompact = false,
  showStreak = true,
  showRewards = false,
  className,
}: TaskRewardBadgesProps) {
  const isTodo = normalizeTaskType(task) === "todo";
  const hasStreak =
    showStreak && !isTodo && typeof task.streak === "number" && task.streak > 0;
  const hasRewards =
    showRewards &&
    (task.rewardXp !== undefined || task.rewardGold !== undefined);

  if (!hasStreak && !hasRewards) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center shrink-0",
        isCompact ? "gap-1 text-label-s" : "gap-1.5 text-tiny",
        className,
      )}
    >
      {/* Streak (Chama - Exibido para Diárias e Hábitos) */}
      {hasStreak && (
        <span
          className="flex items-center gap-0.5 text-warning-500 font-bold"
          title={`Ofensiva de ${task.streak} dia(s)`}
        >
          <Flame
            size={isCompact ? 9 : 11}
            className="fill-warning-500 text-warning-500 shrink-0"
          />
          <span>{task.streak}d</span>
        </span>
      )}

      {/* XP (apenas se showRewards estiver habilitado) */}
      {showRewards && task.rewardXp !== undefined && (
        <span
          className="flex items-center gap-0.5 text-magenta font-medium"
          title={`Recompensa: +${task.rewardXp} XP`}
        >
          <Sparkles size={isCompact ? 8 : 10} className="shrink-0" />+
          {task.rewardXp}
          {!isCompact && " XP"}
        </span>
      )}

      {/* Ouro (apenas se showRewards estiver habilitado) */}
      {showRewards && task.rewardGold !== undefined && (
        <span
          className="flex items-center gap-0.5 text-gold font-medium"
          title={`Recompensa: +${task.rewardGold} Ouro`}
        >
          <Coins size={isCompact ? 8 : 10} className="shrink-0" />+
          {task.rewardGold}
        </span>
      )}
    </div>
  );
}
