import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
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
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);
  const newItemInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingItemId) {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }
  }, [editingItemId]);

  useEffect(() => {
    if (isAddingItem) {
      newItemInputRef.current?.focus();
    }
  }, [isAddingItem]);

  const handleStartEdit = (item: ChecklistItem) => {
    if (!item.id) return;
    setEditingItemId(item.id);
    setEditingText(item.name || "");
  };

  const handleConfirmEdit = () => {
    if (editingItemId) {
      const trimmed = editingText.trim();
      if (trimmed) {
        onUpdateItem?.(editingItemId, trimmed);
      }
      setEditingItemId(null);
      setEditingText("");
    }
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditingText("");
  };

  const completedCount = checklist.filter((i) => i.isCompleted).length;
  const totalCount = checklist.length;
  const progressPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isAllDone = totalCount > 0 && completedCount === totalCount;

  return (
    <div className="flex flex-col gap-2 pt-1.5 border-t border-white/8">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-tiny font-bold text-neutral-400 uppercase tracking-wider">
          <span>{t("title")}</span>
          {totalCount > 0 && (
            <span
              className={cn(
                "font-semibold",
                isAllDone ? "text-success-500" : "text-gold",
              )}
            >
              {completedCount}/{totalCount}
            </span>
          )}
        </div>

        {totalCount > 0 && (
          <div
            aria-hidden="true"
            className="w-full h-1.5 rounded-full bg-white/8 overflow-hidden"
          >
            <div
              className={cn(
                "h-full rounded-full transition-[width,background-color] duration-300",
                isAllDone ? "bg-success-500" : "bg-gold",
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto custom-scrollbar pr-0.5">
        {checklist.map((item) => {
          const isEditingThis = editingItemId === item.id;
          return (
            <div
              key={item.id}
              className="flex items-center justify-between gap-2 py-1 px-1 rounded-md hover:bg-white/4 group/item transition-colors"
            >
              {isEditingThis ? (
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <input
                    ref={editInputRef}
                    type="text"
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleConfirmEdit();
                      if (e.key === "Escape") handleCancelEdit();
                    }}
                    onBlur={handleConfirmEdit}
                    className="flex-1 bg-background/60 border border-gold/60 rounded px-1.5 py-0.5 text-xs text-neutral-50 focus:outline-none focus:border-gold min-w-0"
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onToggleItem(item.id)}
                  className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer group/toggle focus:outline-none"
                >
                  <span
                    className={cn(
                      "w-3.5 h-3.5 rounded border flex items-center justify-center transition-all shrink-0",
                      item.isCompleted
                        ? "bg-gold border-gold text-on-gold"
                        : "border-primary/50 bg-primary-dark/40 group-hover/toggle:border-gold",
                    )}
                  >
                    {item.isCompleted && (
                      <Check size={9} className="stroke-3" />
                    )}
                  </span>
                  <span
                    className={cn(
                      "text-xs text-neutral-200 truncate transition-colors group-hover/toggle:text-neutral-50",
                      item.isCompleted &&
                        "line-through text-neutral-500 group-hover/toggle:text-neutral-400",
                    )}
                  >
                    {item.name}
                  </span>
                </button>
              )}

              {!isEditingThis && (
                <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover/item:opacity-100 focus-within:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEdit(item);
                    }}
                    className="p-0.5 rounded text-neutral-500 hover:text-gold transition-colors cursor-pointer shrink-0"
                    aria-label={t("editItemAria", { name: item.name ?? "" })}
                    title={t("editItemAria", { name: item.name ?? "" })}
                  >
                    <Pencil size={11} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteItem(item.id);
                    }}
                    className="p-0.5 rounded text-neutral-500 hover:text-danger-500 transition-colors cursor-pointer shrink-0"
                    aria-label={t("deleteItemAria", { name: item.name ?? "" })}
                    title={t("deleteItemAria", { name: item.name ?? "" })}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )}
            </div>
          );
        })}

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
              className="flex-1 bg-background/50 border border-primary/40 rounded px-2 py-0.5 text-xs text-neutral-50 placeholder:text-neutral-500 focus:outline-none focus:border-gold"
            />
            <button
              type="button"
              onClick={onAddItem}
              className="px-2 py-0.5 rounded bg-gold text-on-gold font-bold text-tiny hover:brightness-110 cursor-pointer"
            >
              {t("okButton")}
            </button>
            <button
              type="button"
              onClick={onCancelAddItem}
              className="p-1 text-neutral-400 hover:text-neutral-200 cursor-pointer"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onStartAddItem}
            className="flex items-center gap-1 text-tiny text-neutral-400 hover:text-gold transition-colors font-medium cursor-pointer py-0.5"
          >
            <Plus size={12} />
            <span>{t("addItemButton")}</span>
          </button>
        )}
      </div>
    </div>
  );
}
