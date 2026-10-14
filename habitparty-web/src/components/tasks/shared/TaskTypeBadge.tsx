import { normalizeTaskType, TASK_TYPE_META } from "@/constants/task";
import type { Task } from "@/types/task";
import { cn } from "@/utils";

interface TaskTypeBadgeProps {
  task: Parameters<typeof normalizeTaskType>[0] | Task;
  isCompact?: boolean;
  className?: string;
}

/**
 * Badge padronizada para exibir o tipo da tarefa (Hábito, Diária, Afazer).
 * Compartilhada entre o Kanban de Tasks e a Tabela do Dashboard.
 */
export function TaskTypeBadge({
  task,
  isCompact = false,
  className,
}: TaskTypeBadgeProps) {
  const taskType = normalizeTaskType(task);
  const typeMeta = TASK_TYPE_META[taskType] || TASK_TYPE_META.todo;

  return (
    <span
      className={cn(
        "rounded font-semibold border truncate shrink-0 uppercase transition-colors",
        isCompact
          ? "px-1.5 py-0.5 text-[8px] tracking-normal leading-tight"
          : "px-2 py-0.5 text-label-m tracking-wide shadow-2xs",
        typeMeta.color,
        className,
      )}
    >
      {typeMeta.label}
    </span>
  );
}
