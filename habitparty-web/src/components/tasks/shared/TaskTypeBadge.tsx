import { CheckSquare, Flame, RotateCcw } from "lucide-react";
import { normalizeTaskType, TASK_TYPE_META } from "@/constants/task";
import type { Task } from "@/types/task";
import { cn } from "@/utils";

interface TaskTypeBadgeProps {
  task: Parameters<typeof normalizeTaskType>[0] | Task;
  isCompact?: boolean;
  className?: string;
  showIcon?: boolean;
}

/**
 * Badge padronizada para exibir o tipo da tarefa (Hábito, Diária, Afazer).
 * Compartilhada entre o Kanban de Tasks e a Tabela do Dashboard.
 */
export function TaskTypeBadge({
  task,
  isCompact = false,
  className,
  showIcon = true,
}: TaskTypeBadgeProps) {
  const taskType = normalizeTaskType(task);
  const typeMeta = TASK_TYPE_META[taskType] || TASK_TYPE_META.todo;

  const renderIcon = () => {
    if (!showIcon) return null;
    const size = isCompact ? 9 : 11;
    if (taskType === "habit") {
      return <Flame size={size} className="shrink-0 fill-info/30 text-info" />;
    }
    if (taskType === "daily") {
      return (
        <RotateCcw size={size} className="shrink-0 stroke-[2.5] text-magenta" />
      );
    }
    return (
      <CheckSquare size={size} className="shrink-0 stroke-[2.5] text-gold" />
    );
  };

  return (
    <span
      className={cn(
        "rounded font-semibold border truncate shrink-0 uppercase transition-colors inline-flex items-center gap-1 leading-none",
        isCompact
          ? "px-1.5 py-0.5 text-label-s tracking-normal leading-tight"
          : "px-2 py-0.5 text-label-m tracking-wide shadow-2xs",
        typeMeta.color,
        className,
      )}
    >
      {renderIcon()}
      <span>{typeMeta.label}</span>
    </span>
  );
}
