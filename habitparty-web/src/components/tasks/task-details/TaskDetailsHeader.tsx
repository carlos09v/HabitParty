import { Flame, FolderKanban, Pencil, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Task, TaskPriorityOption } from "@/types/task";
import { cn } from "@/utils";
import { isTaskHardcoreLocked } from "@/utils/date";
import { TaskDatePicker } from "./TaskDatePicker";
import { TaskPriorityPicker } from "./TaskPriorityPicker";

interface TaskDetailsHeaderProps {
  task: Task;
  columnTitle?: string;
  completed: boolean;
  isHabit: boolean;
  isDaily: boolean;
  isTodo: boolean;
  dueDate: string;
  dueTime?: string;
  startTime?: string;
  dueEndTime?: string;
  isAllDay?: boolean;
  priority: string;
  onToggleComplete: () => void;
  onHabitDelta?: (delta: number) => void;
  onDateChange: (newDate: string) => void;
  onTimeChange?: (newTime: string) => void;
  onStartTimeChange?: (newStartTime: string) => void;
  onEndTimeChange?: (newEndTime: string) => void;
  onAllDayChange?: (newAllDay: boolean) => void;
  onPrioritySelect: (p: TaskPriorityOption) => void;
  onEdit?: () => void;
  onClose?: () => void;
}

export function TaskDetailsHeader({
  task,
  columnTitle,
  isHabit,
  isDaily,
  isTodo,
  dueDate,
  dueTime,
  startTime,
  dueEndTime,
  isAllDay,
  priority,
  onDateChange,
  onTimeChange,
  onStartTimeChange,
  onEndTimeChange,
  onAllDayChange,
  onPrioritySelect,
  onEdit,
  onClose,
}: TaskDetailsHeaderProps) {
  const t = useTranslations("tasks.detailsPopover.header");
  const streak = task.streak ?? task.currentStreak ?? 0;
  const habitScore = (task.positiveCount ?? 0) - (task.negativeCount ?? 0);
  const isDateLocked = isTaskHardcoreLocked(task);

  return (
    <div className="flex items-center justify-between gap-2 border-b border-white/8 pb-2.5">
      <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
        {columnTitle && (
          <>
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/6 border border-white/10 text-neutral-300 text-tiny font-semibold truncate max-w-[115px]"
              title={columnTitle}
            >
              <FolderKanban size={11} className="text-gold/80 shrink-0" />
              <span className="truncate">{columnTitle}</span>
            </span>
            <div className="h-3.5 w-px bg-white/12 shrink-0" />
          </>
        )}

        {/* HÁBITO: Badge + Reset + Saldo */}
        {isHabit ? (
          <div className="flex items-center gap-1.5 min-w-0">
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
        ) : isTodo ? (
          <TaskDatePicker
            dueDate={dueDate}
            dueTime={dueTime}
            startTime={startTime ?? task.startTime}
            dueEndTime={dueEndTime ?? task.dueEndTime}
            isAllDay={isAllDay ?? task.isAllDay}
            onDateChange={onDateChange}
            onTimeChange={onTimeChange}
            onStartTimeChange={onStartTimeChange}
            onEndTimeChange={onEndTimeChange}
            onAllDayChange={onAllDayChange}
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
      </div>

      {/* Canto Superior Direito: Bandeira de Prioridade + Lápis + Fechar X */}
      <div className="flex items-center gap-1 shrink-0">
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
