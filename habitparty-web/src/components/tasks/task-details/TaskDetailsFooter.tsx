"use client";

import { Baseline, Copy, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useRef, useState } from "react";
import { RewardPreview } from "@/components/ui/reward/RewardPreview";
import { MARKDOWN_FORMAT_OPTIONS } from "@/constants/task";
import { useClickOutside } from "@/hooks/useClickOutside";
import type { AppLocale } from "@/i18n/config";
import type { FormatSyntax, TaskDetailsFooterProps } from "@/types/task-ui";
import { cn } from "@/utils";
import { getTaskRewardBreakdown, toTaskRewardEstimate } from "@/utils/economy";

export type { FormatSyntax };

export function TaskDetailsFooter({
  task,
  columnTitle,
  onApplyFormat,
  onDeleteTask,
  onDuplicateTask,
  onOpenEdit,
}: TaskDetailsFooterProps) {
  const t = useTranslations("tasks.detailsPopover.footer");
  const locale = useLocale() as AppLocale;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFormatMenuOpen, setIsFormatMenuOpen] = useState(false);
  const menuContainerRef = useRef<HTMLDivElement>(null);
  const formatContainerRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuContainerRef, () => setIsMenuOpen(false), {
    enabled: isMenuOpen,
  });

  useClickOutside(formatContainerRef, () => setIsFormatMenuOpen(false), {
    enabled: isFormatMenuOpen,
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

  return (
    <div className="flex items-center justify-between pt-1 border-t border-white/8 mt-0.5 min-w-0">
      <div className="flex items-center gap-2 min-w-0">
        {columnTitle && (
          <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-neutral-400 text-tiny font-medium truncate max-w-[110px]">
            {columnTitle}
          </span>
        )}

        {rewardEstimate && (
          <RewardPreview
            estimate={rewardEstimate}
            variant="inline"
            label={t("rewardsLabel")}
          />
        )}
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {/* Menu Popover de Formatação de Texto */}
        {onApplyFormat && (
          <div ref={formatContainerRef} className="relative">
            <button
              type="button"
              onClick={() => setIsFormatMenuOpen((prev) => !prev)}
              title={t("formatButtonTitle")}
              className={cn(
                "p-1.5 rounded-md transition-all cursor-pointer",
                isFormatMenuOpen
                  ? "bg-gold text-on-gold shadow-glow-gold-xs font-bold"
                  : "text-neutral-300 hover:text-gold hover:bg-white/8",
              )}
              aria-label={t("formatButtonAria")}
              aria-expanded={isFormatMenuOpen}
            >
              <Baseline size={15} />
            </button>

            {isFormatMenuOpen && (
              <div
                role="menu"
                aria-label={t("formatMenuAria")}
                className="absolute right-0 bottom-full mb-2 w-48 bg-popover/98 border border-primary/40 rounded-xl shadow-2xl p-1.5 z-50 flex flex-col gap-0.5 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
              >
                <div className="px-2 py-1 border-b border-white/10 text-tiny font-semibold text-neutral-400 uppercase tracking-wider flex items-center justify-between">
                  <span>{t("formatHeader")}</span>
                  <span className="text-label-m text-neutral-500 font-normal">
                    {t("markdownLabel")}
                  </span>
                </div>

                {MARKDOWN_FORMAT_OPTIONS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.syntax}
                      type="button"
                      onClick={() => {
                        onApplyFormat(item.syntax);
                        setIsFormatMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-neutral-200 hover:text-gold hover:bg-white/10 transition-colors cursor-pointer text-left"
                    >
                      <Icon
                        size={13}
                        className={cn(item.iconColorClass, "shrink-0")}
                      />
                      <span className={item.labelClass}>
                        {t(`formats.${item.syntax}`)}
                      </span>
                      <span className="text-tiny text-neutral-500 ml-auto font-mono">
                        {item.hint}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Menu de Mais Opções */}
        <div ref={menuContainerRef} className="relative">
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            title={t("moreOptionsTitle")}
            className="p-1.5 rounded-md text-neutral-300 hover:text-gold hover:bg-white/8 transition-colors cursor-pointer"
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
