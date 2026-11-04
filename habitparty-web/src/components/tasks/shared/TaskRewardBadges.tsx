import { Coins, Flame, Sparkles, Sword, Swords } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  DIFFICULTY_DOT_COLORS,
  DIFFICULTY_SWORD_COLORS,
  normalizeTaskDifficulty,
  normalizeTaskType,
  TASK_DIFFICULTY_META,
} from "@/constants/task";
import { useExperienceMode } from "@/hooks/useExperienceMode";
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
 * Exibe as recompensas (XP, Ouro), indicador de dificuldade (Espada no modo RPG ou Ponto no modo Produtividade) e Streak.
 * Regra: Ícone de streak (chama 🔥) é exibido em Tarefas Diárias (Daily) e Hábitos (Habit) com streak ativo (> 0).
 * No perfil Gamificado (RPG), exibe o ícone de Espada da dificuldade; no perfil Produtividade, exibe o indicador discreto em ponto.
 */
export function TaskRewardBadges({
  task,
  isCompact = false,
  showStreak = true,
  showRewards = false,
  className,
}: TaskRewardBadgesProps) {
  const t = useTranslations("dashboard.taskShared");
  const { isGamified } = useExperienceMode();
  const taskType = normalizeTaskType(task);
  const isTodo = taskType === "todo";
  const isHabit = taskType === "habit";
  const hasStreak =
    showStreak && !isTodo && typeof task.streak === "number" && task.streak > 0;
  const effectiveShowRewards = isGamified ? showRewards : false;
  const hasRewards =
    effectiveShowRewards &&
    (task.rewardXp !== undefined || task.rewardGold !== undefined);
  const showDifficultyIndicator = true;

  if (!hasStreak && !hasRewards && !showDifficultyIndicator) {
    return null;
  }

  const rawImportance = (
    task.importanceType ||
    task.importance ||
    "NORMAL"
  ).toUpperCase();
  const normalizedImportance: "LOW" | "NORMAL" | "HIGH" =
    rawImportance === "LOW" || rawImportance === "HIGH"
      ? rawImportance
      : "NORMAL";

  const normalizedDiff = isHabit
    ? normalizedImportance === "LOW"
      ? "TRIVIAL"
      : normalizedImportance === "HIGH"
        ? "HARD"
        : "EASY"
    : normalizeTaskDifficulty(task.difficulty);
  const diffMeta =
    TASK_DIFFICULTY_META[normalizedDiff] || TASK_DIFFICULTY_META.MEDIUM;
  const DifficultySwordIcon =
    normalizedDiff === "MEDIUM" || normalizedDiff === "HARD" ? Swords : Sword;
  const diffLabel = isHabit
    ? t(`importances.${normalizedImportance}`)
    : t(`difficulties.${normalizedDiff}`);
  const gamifiedIndicatorTitle = isHabit
    ? t("badges.importanceTitle", { label: diffLabel })
    : t("badges.difficultyTitle", { label: diffLabel });

  return (
    <div
      className={cn(
        "flex items-center shrink-0",
        isCompact ? "gap-1 text-label-s" : "gap-1.5 text-tiny",
        className,
      )}
    >
      {/* Indicador de Dificuldade/Importância: Espada no modo Gamificado ou Ponto Luminoso no modo Produtividade */}
      {showDifficultyIndicator &&
        (isGamified ? (
          <span
            className={cn(
              "flex items-center gap-0.5 font-medium",
              DIFFICULTY_SWORD_COLORS[normalizedDiff] || diffMeta.color,
            )}
            title={gamifiedIndicatorTitle}
          >
            <DifficultySwordIcon
              size={isCompact ? 10 : 12}
              className="shrink-0"
            />
          </span>
        ) : (
          <span
            className="flex items-center gap-1 font-medium text-neutral-400"
            title={t("badges.effortTitle", { label: diffLabel })}
          >
            <span
              className={cn(
                "rounded-full shrink-0",
                isCompact ? "w-1.5 h-1.5" : "w-2 h-2",
                DIFFICULTY_DOT_COLORS[normalizedDiff],
              )}
            />
          </span>
        ))}

      {/* Streak (Chama - Exibido para Diárias e Hábitos) */}
      {hasStreak && (
        <span
          className="flex items-center gap-0.5 text-warning-500 font-bold"
          title={t("badges.streakTitle", { count: task.streak ?? 0 })}
        >
          <Flame
            size={isCompact ? 9 : 11}
            className="fill-warning-500 text-warning-500 shrink-0"
          />
          <span>{task.streak}d</span>
        </span>
      )}

      {/* XP (apenas se showRewards estiver habilitado e no modo Gamificado) */}
      {effectiveShowRewards && task.rewardXp !== undefined && (
        <span
          className="flex items-center gap-0.5 text-magenta font-medium"
          title={t("badges.rewardXpTitle", { xp: task.rewardXp })}
        >
          <Sparkles size={isCompact ? 8 : 10} className="shrink-0" />+
          {task.rewardXp}
          {!isCompact && " XP"}
        </span>
      )}

      {/* Ouro (apenas se showRewards estiver habilitado e no modo Gamificado) */}
      {effectiveShowRewards && task.rewardGold !== undefined && (
        <span
          className="flex items-center gap-0.5 text-gold font-medium"
          title={t("badges.rewardGoldTitle", { gold: task.rewardGold })}
        >
          <Coins size={isCompact ? 8 : 10} className="shrink-0" />+
          {task.rewardGold}
        </span>
      )}
    </div>
  );
}
