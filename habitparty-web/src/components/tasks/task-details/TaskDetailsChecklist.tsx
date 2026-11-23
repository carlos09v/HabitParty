"use client";

import { Plus, Swords, X, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef } from "react";
import {
  ChecklistItemRow,
  useChecklistInlineEdit,
} from "@/components/tasks/shared/ChecklistEditor";
import {
  ChecklistRewardCounter,
  ChecklistRewardInfoTooltip,
  getChecklistRewardStats,
  useChecklistRewardRowHelpers,
} from "@/components/tasks/shared/ChecklistRewardInfoTooltip";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { ChecklistItem } from "@/types/task";
import { cn } from "@/utils";

interface TaskDetailsChecklistProps {
  checklist: ChecklistItem[];
  canReward?: boolean;
  isTaskCompleted?: boolean;
  isAddingItem: boolean;
  newItemText: string;
  onNewItemTextChange: (val: string) => void;
  isNewItemRewarded?: boolean;
  onNewItemRewardedChange?: (val: boolean) => void;
  onStartAddItem: () => void;
  onCancelAddItem: () => void;
  onAddItem: () => void;
  onToggleItem: (itemId?: string) => void;
  onToggleReward?: (itemId?: string) => void;
  onUpdateItem?: (itemId?: string, newName?: string) => void;
  onDeleteItem: (itemId?: string) => void;
}

export function TaskDetailsChecklist({
  checklist,
  canReward = false,
  isTaskCompleted = false,
  isAddingItem,
  newItemText,
  onNewItemTextChange,
  isNewItemRewarded = false,
  onNewItemRewardedChange,
  onStartAddItem,
  onCancelAddItem,
  onAddItem,
  onToggleItem,
  onToggleReward,
  onUpdateItem,
  onDeleteItem,
}: TaskDetailsChecklistProps) {
  const t = useTranslations("tasks.detailsPopover.checklist");
  const newItemInputRef = useRef<HTMLInputElement>(null);
  const { rewardedCount, isLimitReached } = getChecklistRewardStats(checklist);
  const {
    isGamified,
    chipLabel,
    rewardLockedWhileCompletedTitle,
    getRowRewardLabels,
    getNewStepToggleLabels,
  } = useChecklistRewardRowHelpers();
  const RewardIcon = isGamified ? Swords : Zap;
  const isNewRewardActive = Boolean(
    canReward && isNewItemRewarded && !isTaskCompleted && !isLimitReached,
  );
  const newToggleLabels = getNewStepToggleLabels({
    isLimitReached,
    isTaskCompleted,
  });

  const handleConfirmUpdate = useCallback(
    (itemId: string, trimmedName: string) => {
      onUpdateItem?.(itemId, trimmedName);
    },
    [onUpdateItem],
  );

  const {
    editingKey: editingItemId,
    editingText,
    setEditingText,
    editInputRef,
    startEdit,
    confirmEdit,
    cancelEdit,
  } = useChecklistInlineEdit<string>(handleConfirmUpdate);

  useEffect(() => {
    if (isAddingItem) {
      newItemInputRef.current?.focus();
    }
  }, [isAddingItem]);

  const completedCount = checklist.filter((i) => i.isCompleted).length;
  const totalCount = checklist.length;
  const progressPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isAllDone = totalCount > 0 && completedCount === totalCount;

  return (
    <div className="flex flex-col gap-2 pt-1.5 border-t border-neutral-700/60 dark:border-white/8">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2 text-tiny font-bold text-neutral-400 uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <span>{t("title")}</span>
            {canReward && (
              <ChecklistRewardInfoTooltip align="left" side="bottom" />
            )}
          </div>
          <div className="flex items-center gap-2">
            {canReward && (
              <ChecklistRewardCounter rewardedCount={rewardedCount} />
            )}
            {totalCount > 0 && (
              <span
                className={cn(
                  "font-semibold",
                  isAllDone
                    ? "text-success-500"
                    : "text-amber-700 dark:text-gold",
                )}
              >
                {completedCount}/{totalCount}
              </span>
            )}
          </div>
        </div>

        {totalCount > 0 && (
          <ProgressBar
            decorative
            percent={progressPercent}
            className="h-1.5 bg-neutral-700/40 dark:bg-white/8"
            fillClassName={cn(
              "rounded-full transition-[transform,background-color] duration-300",
              isAllDone ? "bg-success-500" : "bg-gold",
            )}
          />
        )}
      </div>
      <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto custom-scrollbar pr-0.5">
        {checklist.map((item) => (
          <ChecklistItemRow
            key={item.id}
            item={item}
            variant="popover"
            isEditing={editingItemId === item.id}
            editingText={editingText}
            editInputRef={editInputRef}
            onEditingTextChange={setEditingText}
            onConfirmEdit={confirmEdit}
            onCancelEdit={cancelEdit}
            onStartEdit={() => {
              if (item.id) startEdit(item.id, item.name);
            }}
            onToggle={() => onToggleItem(item.id)}
            onDelete={() => onDeleteItem(item.id)}
            canReward={canReward}
            isRewardLimitReached={isLimitReached}
            isRewardToggleDisabled={isTaskCompleted}
            rewardDisabledTitle={rewardLockedWhileCompletedTitle}
            rewardChipLabel={chipLabel}
            onToggleReward={() => onToggleReward?.(item.id)}
            labels={{
              editAria: t("editItemAria", { name: item.name ?? "" }),
              deleteAria: t("deleteItemAria", { name: item.name ?? "" }),
              ...getRowRewardLabels(item.name, Boolean(item.isRewarded)),
            }}
          />
        ))}

        {isAddingItem ? (
          <div className="flex items-center gap-1.5 mt-1">
            <input
              ref={newItemInputRef}
              type="text"
              value={newItemText}
              onChange={(e) => onNewItemTextChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onAddItem();
                if (e.key === "Escape") onCancelAddItem();
              }}
              placeholder={t("newItemPlaceholder")}
              className="flex-1 min-w-0 bg-card border border-neutral-600 rounded px-2 py-0.5 text-xs text-neutral-50 placeholder:text-neutral-400 focus:outline-none focus:border-primary dark:bg-background/50 dark:border-primary/40 dark:placeholder:text-neutral-500 dark:focus:border-gold"
            />
            {canReward && onNewItemRewardedChange && (
              <button
                type="button"
                onClick={() => onNewItemRewardedChange(!isNewItemRewarded)}
                disabled={isTaskCompleted || isLimitReached}
                aria-pressed={isNewRewardActive}
                aria-label={newToggleLabels.ariaLabel}
                title={newToggleLabels.title}
                className={cn(
                  "inline-flex items-center justify-center min-h-6 min-w-6 px-1.5 py-0.5 rounded border transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-gold",
                  isNewRewardActive
                    ? "bg-amber-500/15 border-amber-500/50 text-amber-800 hover:bg-amber-500/25 dark:bg-gold/15 dark:border-gold/55 dark:text-gold dark:hover:bg-gold/25 cursor-pointer"
                    : isTaskCompleted || isLimitReached
                      ? "border-transparent text-neutral-500 opacity-35 cursor-not-allowed"
                      : "border-dashed border-neutral-500/40 text-neutral-400 hover:text-amber-700 hover:border-amber-500/50 hover:bg-gold/10 dark:border-neutral-600 dark:text-neutral-400 dark:hover:text-gold dark:hover:border-gold/50 cursor-pointer",
                )}
              >
                <RewardIcon size={12} className="shrink-0" aria-hidden="true" />
              </button>
            )}
            <button
              type="button"
              onClick={onAddItem}
              className="px-2 py-0.5 rounded bg-gold text-on-gold font-bold text-tiny hover:bg-gold-hover transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-gold"
            >
              {t("okButton")}
            </button>
            <button
              type="button"
              onClick={onCancelAddItem}
              aria-label={t("cancelButtonAria")}
              className="inline-flex items-center justify-center min-h-6 min-w-6 p-1 text-neutral-400 hover:text-neutral-100 dark:hover:text-neutral-200 cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-gold"
            >
              <X size={12} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onStartAddItem}
            className="flex items-center gap-1 text-tiny text-neutral-300 dark:text-neutral-400 hover:text-primary dark:hover:text-gold transition-colors font-medium cursor-pointer py-0.5"
          >
            <Plus size={12} />
            <span>{t("addItemButton")}</span>
          </button>
        )}
      </div>
    </div>
  );
}
