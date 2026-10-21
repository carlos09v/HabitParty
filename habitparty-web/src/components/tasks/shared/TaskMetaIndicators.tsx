import { CheckSquare, Flag, MessageSquare, Zap } from "lucide-react";
import { TASK_PRIORITY_META } from "@/constants/task";
import type { Task } from "@/types/task";
import { cn } from "@/utils";

export function TaskChecklistBadge({
  checklistCompleted,
  checklistTotal,
  isChecklistAllDone,
  isCompact = false,
}: {
  checklistCompleted: number;
  checklistTotal: number;
  isChecklistAllDone: boolean;
  isCompact?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium rounded border px-1.5 py-0.5 shrink-0",
        isCompact ? "text-label-s leading-none" : "text-tiny",
        isChecklistAllDone
          ? "text-success-500 bg-success-500/10 border-success-500/30 font-semibold"
          : "text-neutral-300 bg-white/5 border-white/10",
      )}
      title={`Subtarefas: ${checklistCompleted} de ${checklistTotal} concluídas`}
    >
      <CheckSquare
        size={isCompact ? 9 : 11}
        className={isChecklistAllDone ? "text-success-500" : "text-neutral-400"}
      />
      <span>
        {checklistCompleted}/{checklistTotal}
      </span>
    </span>
  );
}

export function TaskHardcoreBadge({
  isHardcoreOverdue,
  isCompact = false,
}: {
  isHardcoreOverdue: boolean;
  isCompact?: boolean;
}) {
  return (
    <span
      title={
        isHardcoreOverdue
          ? "Modo Hardcore: Prazo fatal expirado! Penalidade de 50% ativa!"
          : "Modo Hardcore Ativo"
      }
      className={cn(
        "shrink-0 transition-colors",
        isHardcoreOverdue
          ? "text-danger-500 animate-pulse"
          : "text-warning-500 hover:text-warning-hover",
      )}
    >
      <Zap size={isCompact ? 10 : 12} />
    </span>
  );
}

export function TaskDescriptionBadge({
  isCompact = false,
  className,
}: {
  isCompact?: boolean;
  className?: string;
}) {
  return (
    <span
      title="Possui descrição detalhada"
      className={cn("text-neutral-400 shrink-0", className)}
    >
      <MessageSquare size={isCompact ? 10 : 12} />
    </span>
  );
}

export function TaskPriorityBadge({
  priority,
  isCompact = false,
  sizeVariant = "row",
}: {
  priority?: Task["priority"];
  isCompact?: boolean;
  sizeVariant?: "card" | "row";
}) {
  if (!priority || (priority as string).toUpperCase() === "NONE") {
    return null;
  }
  const meta = TASK_PRIORITY_META[priority];
  return (
    <span
      title={`Prioridade: ${meta?.label || priority}`}
      className={cn(
        "flex items-center justify-center transition-all select-none shrink-0 border",
        sizeVariant === "card" ? "p-0.5 rounded" : "p-1 rounded-md",
        meta?.badgeColor || "text-neutral-400 bg-white/5 border-white/10",
      )}
    >
      <Flag size={isCompact ? 9 : 11} />
    </span>
  );
}

export function TaskHabitScoreBadge({
  habitScore,
  resetCounter,
  variant = "row",
  isCompact = false,
}: {
  habitScore: number;
  resetCounter?: Task["resetCounter"];
  variant?: "card" | "row";
  isCompact?: boolean;
}) {
  const formattedScore = habitScore > 0 ? `+${habitScore}` : String(habitScore);

  if (variant === "card") {
    return (
      <span
        className={cn(
          "font-bold px-1.5 py-0.5 rounded flex items-center gap-1",
          isCompact ? "text-label-s" : "text-tiny",
          habitScore >= 0
            ? "text-success-500 bg-success-500/10"
            : "text-danger-500 bg-danger-500/10",
        )}
        title={`Saldo de repetições realizadas no ciclo atual: ${formattedScore}`}
      >
        <span>{formattedScore}</span>
        <span className="font-normal opacity-70">
          {resetCounter === "WEEKLY"
            ? "semana"
            : resetCounter === "MONTHLY"
              ? "mês"
              : "hoje"}
        </span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "font-bold text-label-m px-1.5 py-0.5 rounded",
        habitScore >= 0
          ? "text-success-500 bg-success-500/10"
          : "text-danger-500 bg-danger-500/10",
      )}
      title={`Saldo de repetições realizadas: ${formattedScore}`}
    >
      Saldo: {formattedScore}
    </span>
  );
}
