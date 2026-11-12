"use client";

import { Copy, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useRef, useState } from "react";
import { TaskHardcoreBadge, TaskRewardBadges } from "@/components/tasks/shared";
import { RewardPreview } from "@/components/ui/reward/RewardPreview";
import { normalizeTaskType } from "@/constants/task";
import { useClickOutside } from "@/hooks/useClickOutside";
import type { AppLocale } from "@/i18n/config";
import type { FormatSyntax, TaskDetailsFooterProps } from "@/types/task-ui";
import { getTaskDueDateInfo } from "@/utils/date";
import { getTaskRewardBreakdown, toTaskRewardEstimate } from "@/utils/economy";

export type { FormatSyntax };

export function TaskDetailsFooter({
  task,
  onDeleteTask,
  onDuplicateTask,
  onOpenEdit,
}: TaskDetailsFooterProps) {
  const t = useTranslations("tasks.detailsPopover.footer");
  const locale = useLocale() as AppLocale;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuContainerRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuContainerRef, () => setIsMenuOpen(false), {
    enabled: isMenuOpen,
  });

  const rewardEstimate = useMemo(() => {
    if (!task) return null;
    const breakdown = getTaskRewardBreakdown({
      taskType: task.type,
      difficulty: task.difficulty,
      importanceType: task.importanceType,
      repeatType: task.repeatType,
      resetCounter: task.resetCounter,
      currentStreak:
        task.currentStreak ?? task.streak ?? task.positiveCount ?? 0,
      isHardcoreModeEnabled: task.isHardcoreModeEnabled,
      dueDate: task.dueDate,
      isPenaltyApplied: task.isPenaltyApplied,
      locale,
    });
    return toTaskRewardEstimate(breakdown, {
      isHardcore: task.isHardcoreModeEnabled,
      taskType: task.type,
      locale,
    });
  }, [task, locale]);

  const isHardcoreOverdue = useMemo(() => {
    if (!task) return false;
    const isTodo = normalizeTaskType(task) === "todo";
    const dueDateInfo = getTaskDueDateInfo(task.dueDate, {
      dueTime: task.dueTime,
      dueEndTime: task.dueEndTime,
    });
    return Boolean(
      isTodo && task.isHardcoreModeEnabled && dueDateInfo.isOverdue,
    );
  }, [task]);

  return (
    <div className="flex items-center justify-between pt-2 border-t border-white/8 mt-0.5 min-w-0">
      <div className="flex items-center gap-2 min-w-0 flex-wrap">
        {rewardEstimate && (
          <RewardPreview
            estimate={rewardEstimate}
            variant="inline"
            label={t("rewardsLabel")}
          />
        )}

        {task && (
          <div className="flex items-center gap-1.5 pl-1 border-l border-white/10">
            <TaskRewardBadges
              task={task}
              showStreak={false}
              showRewards={false}
            />
            {task.isHardcoreModeEnabled && (
              <TaskHardcoreBadge isHardcoreOverdue={isHardcoreOverdue} />
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {/* Menu de Mais Opções */}
        <div ref={menuContainerRef} className="relative">
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            title={t("moreOptionsTitle")}
            className="p-1.5 rounded-lg text-neutral-300 hover:text-gold hover:bg-white/8 transition-colors cursor-pointer"
          >
            <MoreHorizontal size={15} />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 bottom-full mb-1.5 w-36 bg-popover border border-primary/40 rounded-lg shadow-xl py-1 z-50 animate-in fade-in duration-100">
              {onOpenEdit && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenEdit();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-neutral-200 hover:text-gold hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <Pencil size={12} />
                  <span>{t("editFull")}</span>
                </button>
              )}
              {onDuplicateTask && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onDuplicateTask();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-neutral-200 hover:text-gold hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <Copy size={12} />
                  <span>{t("duplicate")}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onDeleteTask();
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-danger-500 hover:bg-danger-500/10 cursor-pointer"
              >
                <Trash2 size={12} />
                <span>{t("deleteTask")}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
