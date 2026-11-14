"use client";

import { Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef } from "react";
import {
  ChecklistItemRow,
  useChecklistInlineEdit,
} from "@/components/tasks/shared/ChecklistEditor";
import type { ChecklistItem } from "@/types/task";
import { cn } from "@/utils";

interface TaskDetailsChecklistProps {
  checklist: ChecklistItem[];
  isAddingItem: boolean;
  newItemText: string;
  onNewItemTextChange: (val: string) => void;
  onStartAddItem: () => void;
  onCancelAddItem: () => void;
  onAddItem: () => void;
  onToggleItem: (itemId?: string) => void;
  onUpdateItem?: (itemId?: string, newName?: string) => void;
  onDeleteItem: (itemId?: string) => void;
}

export function TaskDetailsChecklist({
  checklist,
  isAddingItem,
  newItemText,
  onNewItemTextChange,
  onStartAddItem,
  onCancelAddItem,
  onAddItem,
  onToggleItem,
  onUpdateItem,
  onDeleteItem,
}: TaskDetailsChecklistProps) {
  const t = useTranslations("tasks.detailsPopover.checklist");
  const newItemInputRef = useRef<HTMLInputElement>(null);

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
        <div className="flex items-center justify-between text-tiny font-bold text-neutral-400 uppercase tracking-wider">
          <span>{t("title")}</span>
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

        {totalCount > 0 && (
          <div
            aria-hidden="true"
            className="w-full h-1.5 rounded-full bg-neutral-700/40 dark:bg-white/8 overflow-hidden"
          >
            <div
              className={cn(
                "h-full w-full origin-left rounded-full transition-[transform,background-color] duration-300",
                isAllDone ? "bg-success-500" : "bg-gold",
              )}
              style={{ transform: `scaleX(${progressPercent / 100})` }}
            />
          </div>
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
            labels={{
              editAria: t("editItemAria", { name: item.name ?? "" }),
              deleteAria: t("deleteItemAria", { name: item.name ?? "" }),
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
              className="flex-1 bg-card border border-neutral-600 rounded px-2 py-0.5 text-xs text-neutral-50 placeholder:text-neutral-400 focus:outline-none focus:border-primary dark:bg-background/50 dark:border-primary/40 dark:placeholder:text-neutral-500 dark:focus:border-gold"
            />
            <button
              type="button"
              onClick={onAddItem}
              className="px-2 py-0.5 rounded bg-gold text-on-gold font-bold text-tiny hover:bg-gold-hover transition-colors cursor-pointer"
            >
              {t("okButton")}
            </button>
            <button
              type="button"
              onClick={onCancelAddItem}
              className="p-1 text-neutral-400 hover:text-neutral-100 dark:hover:text-neutral-200 cursor-pointer"
            >
              <X size={12} />
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
