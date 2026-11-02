import { Check, Flame, Pencil, X } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  TaskActionControl,
  TaskHardcoreBadge,
  TaskRewardBadges,
} from "@/components/tasks/shared";
import type { Task, TaskPriorityOption } from "@/types/task";
import { cn } from "@/utils";
import { getTaskDueDateInfo, isTaskHardcoreLocked } from "@/utils/date";
import { TaskDatePicker } from "./TaskDatePicker";
import { TaskPriorityPicker } from "./TaskPriorityPicker";

interface TaskDetailsHeaderProps {
  task: Task;
  completed: boolean;
  isHabit: boolean;
  isDaily: boolean;
  isTodo: boolean;
  dueDate: string;
  priority: string;
  onToggleComplete: () => void;
  onHabitDelta?: (delta: number) => void;
  onDateChange: (newDate: string) => void;
  onPrioritySelect: (p: TaskPriorityOption) => void;
  onEdit?: () => void;
  onClose?: () => void;
}

export function TaskDetailsHeader({
  task,
  completed,
  isHabit,
  isDaily,
  isTodo,
  dueDate,
  priority,
  onToggleComplete,
  onHabitDelta,
  onDateChange,
  onPrioritySelect,
  onEdit,
  onClose,
}: TaskDetailsHeaderProps) {
  const t = useTranslations("tasks.detailsPopover.header");
  const streak = task.streak ?? task.currentStreak ?? 0;
  const habitScore = (task.positiveCount ?? 0) - (task.negativeCount ?? 0);
  const isDateLocked = isTaskHardcoreLocked(task);
  const dueDateInfo = getTaskDueDateInfo(dueDate || task.dueDate);
  const isHardcoreOverdue = Boolean(
    isTodo && task.isHardcoreModeEnabled && dueDateInfo.isOverdue,
  );

  return (
    <div className="flex items-center justify-between gap-2 border-b border-primary/20 pb-2.5">
      <div className="flex items-center gap-2 min-w-0">
        {/* HÁBITO: Controles +/- diretos + Badge + Reset + Saldo */}
        {isHabit ? (
          <div className="flex items-center gap-2 min-w-0">
            <TaskActionControl
              task={task}
              isHabit={true}
              onDelta={onHabitDelta}
            />

            <div className="h-4 w-px bg-white/15 shrink-0" />

            <span className="px-2 py-0.5 rounded text-tiny font-bold uppercase tracking-wider bg-info/15 border border-info/40 text-info shrink-0">
              {t("habitBadge")}
            </span>
            <span className="text-tiny font-medium text-neutral-400 truncate">
              {task.resetCounter === "WEEKLY"
                ? t("resetWeekly")
                : task.resetCounter === "MONTHLY"
                  ? t("resetMonthly")
                  : t("resetDaily")}
            </span>
            {habitScore !== 0 && (
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded text-tiny font-bold shrink-0",
                  habitScore > 0
                    ? "text-success-500 bg-success-500/10"
                    : "text-danger-500 bg-danger-500/10",
                )}
                title={t("repetitionsTitle")}
              >
                {t("repetitionsCount", {
                  score: habitScore > 0 ? `+${habitScore}` : String(habitScore),
                })}
              </span>
            )}
          </div>
        ) : (
          <>
            {/* Checkbox de Conclusão para Diária e To-Do */}
            <button
              type="button"
              onClick={onToggleComplete}
              aria-label={
                completed ? t("markPendingAria") : t("markCompletedAria")
              }
              className={cn(
                "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-90",
                completed
                  ? "bg-gold border-gold text-on-gold shadow-glow-gold-xs"
                  : isDaily
                    ? "border-magenta/60 bg-magenta/10 hover:border-magenta"
                    : "border-primary-light/55 bg-primary-dark/40 hover:border-gold",
              )}
            >
              {completed && <Check size={12} className="stroke-3" />}
            </button>

            {/* Separador vertical */}
            <div className="h-4 w-px bg-white/15 shrink-0" />

            {/* Prazo (To-Do) ou Badge Diária */}
            {isTodo ? (
              <TaskDatePicker
                dueDate={dueDate}
                onDateChange={onDateChange}
                disabled={isDateLocked}
              />
            ) : isDaily ? (
              <div className="flex items-center gap-1.5">
                <span className="text-tiny font-medium text-magenta bg-magenta/15 border border-magenta/40 px-2 py-0.5 rounded uppercase tracking-wider">
                  {t("dailyBadge")}
                </span>
                {streak > 0 && (
                  <span
                    className="flex items-center gap-1 text-tiny text-warning-500 font-bold shrink-0"
                    title={t("streakTitle", { streak })}
                  >
                    <Flame
                      size={12}
                      className="fill-warning-500 text-warning-500"
                    />
                    {streak}d
                  </span>
                )}
              </div>
            ) : null}
          </>
        )}
      </div>

      {/* Canto Superior Direito: Hardcore + Dificuldade + Bandeira de Prioridade + Lápis + Fechar X */}
      <div className="flex items-center gap-1.5 shrink-0">
        {task.isHardcoreModeEnabled && (
          <TaskHardcoreBadge isHardcoreOverdue={isHardcoreOverdue} />
        )}

        <TaskRewardBadges task={task} showStreak={false} showRewards={false} />

        <TaskPriorityPicker
          priority={priority}
          onPrioritySelect={onPrioritySelect}
        />
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-gold hover:bg-white/10 transition-colors cursor-pointer"
            aria-label={t("editFullAria")}
            title={t("editFullTitle")}
          >
            <Pencil size={14} />
          </button>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-100 hover:bg-white/10 transition-colors cursor-pointer"
            aria-label={t("closeAria")}
            title={t("closeTitle")}
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
