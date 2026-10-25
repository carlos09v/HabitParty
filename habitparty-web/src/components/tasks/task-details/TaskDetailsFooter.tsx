"use client";

import { Baseline, Copy, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { RewardPreview } from "@/components/ui/reward/RewardPreview";
import { MARKDOWN_FORMAT_OPTIONS } from "@/constants/task";
import { useClickOutside } from "@/hooks/useClickOutside";
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
    });
    return toTaskRewardEstimate(breakdown, {
      isHardcore: task.isHardcoreModeEnabled,
      taskType: task.type,
    });
  }, [task]);

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
            label="Recompensas"
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
              title="Formatação de texto (Negrito, Destacar, Lista, etc.)"
              className={cn(
                "p-1.5 rounded-md transition-all cursor-pointer",
                isFormatMenuOpen
                  ? "bg-gold text-neutral-900 shadow-glow-gold-xs font-bold"
                  : "text-neutral-300 hover:text-gold hover:bg-white/8",
              )}
              aria-label="Abrir opções de formatação de texto"
              aria-expanded={isFormatMenuOpen}
            >
              <Baseline size={15} />
            </button>

            {isFormatMenuOpen && (
              <div
                role="menu"
                aria-label="Opções de formatação de texto"
                className="absolute right-0 bottom-full mb-2 w-48 bg-popover/98 border border-primary/40 rounded-xl shadow-2xl p-1.5 z-50 flex flex-col gap-0.5 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
              >
                <div className="px-2 py-1 border-b border-white/10 text-tiny font-semibold text-neutral-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Formatação</span>
                  <span className="text-label-m text-neutral-500 font-normal">
                    Markdown
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
                      <span className={item.labelClass}>{item.label}</span>
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
            title="Mais opções"
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
                  <span>Editar completo</span>
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
                  <span>Duplicar</span>
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
                <span>Excluir tarefa</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
