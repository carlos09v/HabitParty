"use client";

import { CheckSquare } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  ChecklistItemRow,
  useChecklistInlineEdit,
} from "@/components/tasks/shared/ChecklistEditor";
import {
  ChecklistRewardCounter,
  ChecklistRewardInfoTooltip,
  getChecklistRewardStats,
  RewardedStepToggleButton,
  useChecklistRewardRowHelpers,
} from "@/components/tasks/shared/ChecklistRewardInfoTooltip";
import type { CreateTaskFormReturn } from "@/hooks/useCreateTaskForm";

interface TaskChecklistSectionProps {
  form: CreateTaskFormReturn;
}

export function TaskChecklistSection({ form }: TaskChecklistSectionProps) {
  const t = useTranslations("tasks.taskModal.checklistSection");
  const {
    checklist,
    canRewardChecklistItems,
    isTaskCompleted,
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
  const {
    chipLabel,
    rewardLockedWhileCompletedTitle,
    getRowRewardLabels,
    getNewStepToggleLabels,
  } = useChecklistRewardRowHelpers();
  const isNewRewardActive =
    canRewardChecklistItems &&
    isNewChecklistRewarded &&
    !isTaskCompleted &&
    !isLimitReached;
  const newToggleLabels = getNewStepToggleLabels({
    isLimitReached,
    isTaskCompleted,
  });

  const {
    editingKey: editingItemId,
    editingText,
    setEditingText,
    editInputRef,
    startEdit,
    confirmEdit,
    cancelEdit,
  } = useChecklistInlineEdit<string>(handleUpdateChecklistItem, isPending);

  return (
    <div className="flex flex-col gap-2 pt-2 border-t border-neutral-700/70 dark:border-white/10">
      <div className="flex items-center justify-between gap-2 shrink-0">
        <span className="text-body-s text-neutral-300 font-medium flex items-center gap-1.5">
          <CheckSquare
            size={15}
            className="text-gold shrink-0"
            aria-hidden="true"
          />
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
          aria-label={t("inputPlaceholder")}
          className="flex-1 min-w-0 bg-card border border-neutral-600 hover:border-neutral-500 rounded-lg px-3 py-1.5 text-neutral-50 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 shadow-xs focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:bg-primary-dark/20 dark:border-primary/30 dark:hover:border-primary/50 dark:shadow-none dark:focus:border-gold dark:focus:ring-1 dark:focus:ring-gold transition-colors text-body-s"
          disabled={isPending}
        />
        {canRewardChecklistItems && (
          <RewardedStepToggleButton
            size="md"
            isActive={isNewRewardActive}
            disabled={isPending || isTaskCompleted || isLimitReached}
            ariaLabel={newToggleLabels.ariaLabel}
            title={newToggleLabels.title}
            onClick={() => setIsNewChecklistRewarded((prev) => !prev)}
          />
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
              isEditing={Boolean(item.id && editingItemId === item.id)}
              editingText={editingText}
              editInputRef={editInputRef}
              disabled={isPending}
              onEditingTextChange={setEditingText}
              onConfirmEdit={confirmEdit}
              onCancelEdit={cancelEdit}
              onStartEdit={() => {
                if (item.id) startEdit(item.id, item.name);
              }}
              onToggle={() => handleToggleChecklistItem(item.id)}
              onDelete={() => handleRemoveChecklistItem(item.id)}
              canReward={canRewardChecklistItems}
              isRewardLimitReached={isLimitReached}
              isRewardToggleDisabled={isTaskCompleted}
              rewardDisabledTitle={rewardLockedWhileCompletedTitle}
              rewardChipLabel={chipLabel}
              onToggleReward={() => handleToggleChecklistItemReward(item.id)}
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
