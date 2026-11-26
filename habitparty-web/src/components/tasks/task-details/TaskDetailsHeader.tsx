"use client";

import { Flame, FolderKanban, Pencil, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { TaskWorkspaceBadge } from "@/components/tasks/shared";
import { useUserStore } from "@/store/userStore";
import type { Task, TaskPriorityOption } from "@/types/task";
import type { DatePickerEventSchedulePatch } from "@/types/ui";
import { cn } from "@/utils";
import { isTaskCycleBasedStreak, isTaskHardcoreLocked } from "@/utils/date";
import { TaskDatePicker } from "./TaskDatePicker";
import { TaskPriorityPicker } from "./TaskPriorityPicker";

interface TaskHeaderStreakBadgeProps {
  streak: number;
  highestStreak: number;
  isCycleBasedStreak: boolean;
}

function TaskHeaderStreakBadge({
  streak,
  highestStreak,
  isCycleBasedStreak,
}: TaskHeaderStreakBadgeProps) {
  const t = useTranslations("tasks.detailsPopover.header");
  if (streak <= 0 && highestStreak <= 0) return null;

  const streakUnit = isCycleBasedStreak ? "x" : "d";
  const title =
    highestStreak > 0
      ? t(
          isCycleBasedStreak
            ? "streakCyclesWithRecordTitle"
            : "streakWithRecordTitle",
          { streak, highestStreak },
        )
      : t(isCycleBasedStreak ? "streakCyclesTitle" : "streakTitle", {
          streak,
        });

  return (
    <span
      className="flex items-center gap-1 text-tiny text-warning-500 font-bold shrink-0"
      title={title}
    >
      <Flame size={12} className="fill-warning-500 text-warning-500" />
      <span>
        {streak}
        {streakUnit}
      </span>
      {highestStreak > streak && (
        <span className="text-[10px] font-semibold text-amber-800/95 dark:text-gold/85">
          (
          {t("recordShort", {
            count: highestStreak,
            unit: streakUnit,
          })}
          )
        </span>
      )}
    </span>
  );
}

interface TaskDetailsHeaderProps {
  task: Task;
  columnTitle?: string;
  workspaceName?: string;
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
  isReadOnly?: boolean;
  onDateChange: (newDate: string) => void;
  onEventScheduleChange?: (patch: DatePickerEventSchedulePatch) => void;
  onPrioritySelect: (p: TaskPriorityOption) => void;
  onEdit?: () => void;
  onClose?: () => void;
}

export function TaskDetailsHeader({
  task,
  columnTitle,
  workspaceName,
  completed,
  isHabit,
  isDaily,
  isTodo,
  dueDate,
  dueTime,
  startTime,
  dueEndTime,
  isAllDay,
  priority,
  isReadOnly = false,
  onDateChange,
  onEventScheduleChange,
  onPrioritySelect,
  onEdit,
  onClose,
}: TaskDetailsHeaderProps) {
  const t = useTranslations("tasks.detailsPopover.header");
  const userTimeZone = useUserStore((s) => s.user?.timezone);
  const streak = task.streak ?? task.currentStreak ?? 0;
  const highestStreak = Math.max(task.highestStreak ?? 0, streak);
  const isCycleBasedStreak = isTaskCycleBasedStreak(task);
  const habitScore = (task.positiveCount ?? 0) - (task.negativeCount ?? 0);
  const isDateLocked = isTaskHardcoreLocked(task, new Date(), userTimeZone);

  return (
    <div className="flex items-center justify-between gap-2 border-b border-neutral-700/60 dark:border-white/8 pb-2.5">
      <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
        {(workspaceName || columnTitle) && (
          <>
            <TaskWorkspaceBadge
              workspaceName={workspaceName}
              isReadOnly={isReadOnly}
              size="header"
            />
            {columnTitle && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface border border-neutral-700/80 dark:bg-white/6 dark:border-white/10 text-neutral-300 text-tiny font-semibold truncate max-w-[115px]"
                title={columnTitle}
              >
                <FolderKanban
                  size={11}
                  className="text-amber-700 dark:text-gold/80 shrink-0"
                />
                <span className="truncate">{columnTitle}</span>
              </span>
            )}
            <div className="h-3.5 w-px bg-neutral-700/60 dark:bg-white/12 shrink-0" />
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
            <TaskHeaderStreakBadge
              streak={streak}
              highestStreak={highestStreak}
              isCycleBasedStreak={isCycleBasedStreak}
            />
          </div>
        ) : isTodo ? (
          <TaskDatePicker
            dueDate={dueDate}
            dueTime={dueTime}
            startTime={startTime ?? task.startTime}
            dueEndTime={dueEndTime ?? task.dueEndTime}
            isAllDay={isAllDay ?? task.isAllDay}
            isCompleted={completed}
            onDateChange={onDateChange}
            onEventScheduleChange={onEventScheduleChange}
            disabled={isDateLocked || isReadOnly}
            disabledReason={
              isReadOnly ? "readonly" : isDateLocked ? "hardcore" : undefined
            }
          />
        ) : isDaily ? (
          <div className="flex items-center gap-1.5">
            <span className="text-tiny font-medium text-magenta dark:text-fuchsia-300 bg-magenta/15 border border-magenta/40 px-2 py-0.5 rounded uppercase tracking-wider">
              {t("dailyBadge")}
            </span>
            <TaskHeaderStreakBadge
              streak={streak}
              highestStreak={highestStreak}
              isCycleBasedStreak={isCycleBasedStreak}
            />
          </div>
        ) : null}
      </div>

      {/* Canto Superior Direito: Bandeira de Prioridade + Lápis + Fechar X */}
      <div className="flex items-center gap-1 shrink-0">
        <TaskPriorityPicker
          priority={priority}
          onPrioritySelect={onPrioritySelect}
          disabled={isReadOnly}
        />
        {onEdit && !isReadOnly && (
          <button
            type="button"
            onClick={onEdit}
            className="w-9 h-9 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-gold hover:bg-white/10 transition-colors cursor-pointer"
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
            className="w-9 h-9 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-100 hover:bg-white/10 transition-colors cursor-pointer"
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
