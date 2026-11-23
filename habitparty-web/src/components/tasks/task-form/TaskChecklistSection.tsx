"use client";

import { CheckSquare, Swords, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
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
import type { CreateTaskFormReturn } from "@/hooks/useCreateTaskForm";
import { cn } from "@/utils";

interface TaskChecklistSectionProps {
  form: CreateTaskFormReturn;
}

export function TaskChecklistSection({ form }: TaskChecklistSectionProps) {
  const t = useTranslations("tasks.taskModal.checklistSection");
  const {
    checklist,
    canRewardChecklistItems,
    newChecklistText,
    setNewChecklistText,
    isNewChecklistRewarded,
    setIsNewChecklistRewarded,
    handleAddChecklistItem,
    handleRemoveChecklistItem,
    handleToggleChecklistItem,
    handleToggleChecklistItemReward,
    handleUpdateChecklistItem,
    isPending,
  } = form;

  const { rewardedCount, isLimitReached } = getChecklistRewardStats(checklist);
  const { isGamified, chipLabel, getRowRewardLabels, getNewStepToggleLabels } =
    useChecklistRewardRowHelpers();
  const RewardIcon = isGamified ? Swords : Zap;
  const isNewRewardActive =
    canRewardChecklistItems && isNewChecklistRewarded && !isLimitReached;
  const newToggleLabels = getNewStepToggleLabels({ isLimitReached });

  const {
    editingKey: editingIndex,
    editingText,
    setEditingText,
    editInputRef,
    startEdit,
    confirmEdit,
    cancelEdit,
  } = useChecklistInlineEdit<number>(handleUpdateChecklistItem, isPending);

  return (
    <div className="flex flex-col gap-2 pt-2 border-t border-neutral-700/70 dark:border-white/10">
      <div className="flex items-center justify-between gap-2 shrink-0">
        <span className="text-body-s text-neutral-300 font-medium flex items-center gap-1.5">
          <CheckSquare size={15} className="text-gold shrink-0" />
          <span>{t("title")}</span>
          {canRewardChecklistItems && (
            <ChecklistRewardInfoTooltip align="left" side="top" />
          )}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {canRewardChecklistItems && (
            <ChecklistRewardCounter rewardedCount={rewardedCount} />
          )}
          <span className="text-tiny text-neutral-400">
            {checklist.length}{" "}
            {checklist.length === 1 ? t("itemSingular") : t("itemPlural")}
          </span>
        </div>
      </div>

      {/* Input para adicionar item */}
      <div className="flex gap-2 shrink-0">
        <input
          type="text"
          value={newChecklistText}
          onChange={(e) => setNewChecklistText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddChecklistItem();
            }
          }}
          placeholder={t("inputPlaceholder")}
          className="flex-1 min-w-0 bg-card border border-neutral-600 hover:border-neutral-500 rounded-lg px-3 py-1.5 text-neutral-50 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 shadow-xs focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:bg-primary-dark/20 dark:border-primary/30 dark:hover:border-primary/50 dark:shadow-none dark:focus:border-gold dark:focus:ring-1 dark:focus:ring-gold transition-colors text-body-s"
          disabled={isPending}
        />
        {canRewardChecklistItems && (
          <button
            type="button"
            onClick={() => setIsNewChecklistRewarded((prev) => !prev)}
            disabled={isPending || isLimitReached}
            aria-pressed={isNewRewardActive}
            aria-label={newToggleLabels.ariaLabel}
            title={newToggleLabels.title}
            className={cn(
              "inline-flex items-center justify-center min-h-8 min-w-8 px-2.5 rounded-lg border transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-gold",
              isNewRewardActive
                ? "bg-amber-500/15 border-amber-500/50 text-amber-800 hover:bg-amber-500/25 dark:bg-gold/15 dark:border-gold/55 dark:text-gold dark:hover:bg-gold/25 cursor-pointer"
                : isLimitReached
                  ? "border-neutral-700/60 text-neutral-500 opacity-45 cursor-not-allowed"
                  : "border-dashed border-neutral-600 text-neutral-300 hover:text-amber-700 hover:border-amber-500/50 hover:bg-gold/10 dark:border-primary/35 dark:text-neutral-400 dark:hover:text-gold dark:hover:border-gold/50 cursor-pointer",
            )}
          >
            <RewardIcon size={15} className="shrink-0" aria-hidden="true" />
          </button>
        )}
        <button
          type="button"
          onClick={handleAddChecklistItem}
          disabled={!newChecklistText.trim() || isPending}
          className="px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-body-s font-semibold transition-colors disabled:bg-neutral-700 disabled:text-neutral-400 disabled:opacity-100 dark:disabled:bg-primary dark:disabled:text-white dark:disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed shrink-0"
        >
          {t("addButton")}
        </button>
      </div>

      {/* Lista de itens do checklist */}
      {checklist.length > 0 && (
        <ul className="flex flex-col gap-1.5 max-h-40 overflow-y-auto custom-scrollbar mt-1 pr-1">
          {checklist.map((item, idx) => (
            <ChecklistItemRow
              key={item.id || `item-${idx}-${item.name}`}
              item={item}
              variant="modal"
              isEditing={editingIndex === idx}
              editingText={editingText}
              editInputRef={editInputRef}
              disabled={isPending}
              onEditingTextChange={setEditingText}
              onConfirmEdit={confirmEdit}
              onCancelEdit={cancelEdit}
              onStartEdit={() => startEdit(idx, item.name)}
              onToggle={() => handleToggleChecklistItem(idx)}
              onDelete={() => handleRemoveChecklistItem(idx)}
              canReward={canRewardChecklistItems}
              isRewardLimitReached={isLimitReached}
              rewardChipLabel={chipLabel}
              onToggleReward={() => handleToggleChecklistItemReward(idx)}
              labels={{
                toggleAria: item.isCompleted
                  ? t("markPendingAria")
                  : t("markCompletedAria"),
                editAria: t("editItemAria", { name: item.name ?? "" }),
                deleteAria: t("removeItemAria", { name: item.name ?? "" }),
                ...getRowRewardLabels(item.name, Boolean(item.isRewarded)),
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
