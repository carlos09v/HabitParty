"use client";

import { Copy, Loader2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useId, useMemo } from "react";
import { createPortal } from "react-dom";
import { TaskHardcoreBadge, TaskRewardBadges } from "@/components/tasks/shared";
import { RewardPreview } from "@/components/ui/reward/RewardPreview";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useFloatingPopover } from "@/hooks/useFloatingPopover";
import type { AppLocale } from "@/i18n/config";
import { useUserStore } from "@/store/userStore";
import type { TaskDetailsFooterProps } from "@/types/task-ui";
import { cn } from "@/utils";
import { isTaskHardcoreOverdue } from "@/utils/date";
import { getTaskRewardBreakdown, toTaskRewardEstimate } from "@/utils/economy";

export function TaskDetailsFooter({
  task,
  isReadOnly = false,
  onDeleteTask,
  onDuplicateTask,
  isDuplicating = false,
  onOpenEdit,
}: TaskDetailsFooterProps) {
  const t = useTranslations("tasks.detailsPopover.footer");
  const locale = useLocale() as AppLocale;
  const { isGamified } = useExperienceMode();
  const userTimeZone = useUserStore((s) => s.user?.timezone);
  const menuTriggerId = useId();
  const menuId = useId();

  const {
    containerRef: menuContainerRef,
    triggerRef: menuTriggerRef,
    popoverRef: menuPopoverRef,
    isOpen: isMenuOpen,
    close: closeMenu,
    toggle: toggleMenu,
    coords: menuCoords,
    shouldRenderPortal: shouldRenderMenuPortal,
    portalContainer: menuPortalContainer,
    floatingStyle: menuFloatingStyle,
  } = useFloatingPopover<HTMLDivElement, HTMLButtonElement, HTMLDivElement>({
    align: "right",
    estimatedHeight: 112,
    estimatedWidth: 144,
    offset: 6,
    zIndex: 150,
    disabled: isReadOnly,
    restoreFocusOnEscape: true,
  });

  useEffect(() => {
    if (!isMenuOpen) return;
    const frameId = window.requestAnimationFrame(() => {
      const firstItem = menuPopoverRef.current?.querySelector<HTMLElement>(
        '[role="menuitem"]:not([disabled])',
      );
      firstItem?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [isMenuOpen, menuPopoverRef]);

  const handleMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(
      e.currentTarget.querySelectorAll<HTMLElement>(
        '[role="menuitem"]:not([disabled])',
      ),
    );
    if (items.length === 0) return;
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      items[(currentIndex + 1) % items.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      items[(currentIndex - 1 + items.length) % items.length]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      items[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      items[items.length - 1]?.focus();
    } else if (e.key === "Tab") {
      closeMenu();
    }
  };

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
      checklist: task.checklist,
      locale,
      timeZone: userTimeZone,
      isGamified,
    });
    return toTaskRewardEstimate(breakdown, {
      isHardcore: task.isHardcoreModeEnabled,
      taskType: task.type,
      locale,
      isGamified,
    });
  }, [task, locale, userTimeZone, isGamified]);

  const isHardcoreOverdue = useMemo(
    () => isTaskHardcoreOverdue(task, userTimeZone),
    [task, userTimeZone],
  );

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-700/60 dark:border-white/8 mt-0.5 min-w-0">
      <div className="flex items-center gap-2 min-w-0 flex-wrap">
        {rewardEstimate && (
          <RewardPreview
            estimate={rewardEstimate}
            variant="inline"
            label={
              isGamified ? t("rewardsLabel") : t("rewardsLabelProductivity")
            }
          />
        )}

        {task && (
          <div className="flex items-center gap-1.5 pl-1 border-l border-neutral-700 dark:border-white/10">
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

      {!isReadOnly && (
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Menu de Mais Opções */}
          <div ref={menuContainerRef} className="relative">
            <button
              ref={menuTriggerRef}
              id={menuTriggerId}
              type="button"
              onClick={toggleMenu}
              title={t("moreOptionsTitle")}
              aria-label={t("moreOptionsTitle")}
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
              aria-controls={menuId}
              className="w-9 h-9 sm:w-7 sm:h-7 flex items-center justify-center rounded-lg text-neutral-300 hover:text-gold hover:bg-white/8 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              <MoreHorizontal size={15} aria-hidden="true" />
            </button>

            {isMenuOpen &&
              shouldRenderMenuPortal &&
              menuCoords &&
              menuPortalContainer &&
              createPortal(
                <div
                  ref={menuPopoverRef}
                  id={menuId}
                  role="menu"
                  aria-label={t("moreOptionsTitle")}
                  data-select-for={menuTriggerId}
                  style={menuFloatingStyle}
                  onKeyDown={handleMenuKeyDown}
                  className={cn(
                    "w-36 bg-popover border border-primary/40 rounded-lg shadow-xl py-1 animate-in fade-in zoom-in-95 duration-100",
                    menuCoords.placement === "top"
                      ? "origin-bottom"
                      : "origin-top",
                  )}
                >
                  {onOpenEdit && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        closeMenu();
                        onOpenEdit();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-neutral-200 hover:text-gold hover:bg-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:bg-white/10 focus-visible:text-gold"
                    >
                      <Pencil size={12} aria-hidden="true" />
                      <span>{t("editFull")}</span>
                    </button>
                  )}
                  {onDuplicateTask && (
                    <button
                      type="button"
                      role="menuitem"
                      disabled={isDuplicating}
                      onClick={() => {
                        closeMenu();
                        onDuplicateTask();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-neutral-200 hover:text-gold hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:bg-white/10 focus-visible:text-gold"
                    >
                      {isDuplicating ? (
                        <Loader2
                          size={12}
                          className="animate-spin"
                          aria-hidden="true"
                        />
                      ) : (
                        <Copy size={12} aria-hidden="true" />
                      )}
                      <span>{t("duplicate")}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      closeMenu();
                      onDeleteTask();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-danger-500 hover:bg-danger-500/10 cursor-pointer focus-visible:outline-none focus-visible:bg-danger-500/15"
                  >
                    <Trash2 size={12} aria-hidden="true" />
                    <span>{t("deleteTask")}</span>
                  </button>
                </div>,
                menuPortalContainer,
              )}
          </div>
        </div>
      )}
    </div>
  );
}
