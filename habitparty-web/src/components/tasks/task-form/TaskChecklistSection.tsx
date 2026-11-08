import { Check, CheckSquare, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import type { CreateTaskFormReturn } from "@/hooks/useCreateTaskForm";
import { cn } from "@/utils";

interface TaskChecklistSectionProps {
  form: CreateTaskFormReturn;
}

export function TaskChecklistSection({ form }: TaskChecklistSectionProps) {
  const t = useTranslations("tasks.taskModal.checklistSection");
  const {
    checklist,
    newChecklistText,
    setNewChecklistText,
    handleAddChecklistItem,
    handleRemoveChecklistItem,
    handleToggleChecklistItem,
    handleUpdateChecklistItem,
    isPending,
  } = form;

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingIndex !== null) {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }
  }, [editingIndex]);

  const handleStartEdit = (idx: number, currentName?: string) => {
    if (isPending) return;
    setEditingIndex(idx);
    setEditingText(currentName || "");
  };

  const handleConfirmEdit = () => {
    if (editingIndex !== null) {
      const trimmed = editingText.trim();
      if (trimmed) {
        handleUpdateChecklistItem(editingIndex, trimmed);
      }
      setEditingIndex(null);
      setEditingText("");
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingText("");
  };

  return (
    <div className="flex flex-col gap-2 pt-2 border-t border-neutral-700/70 dark:border-white/10 flex-1 min-h-0 overflow-hidden">
      <div className="flex items-center justify-between shrink-0">
        <span className="text-body-s text-neutral-300 font-medium flex items-center gap-1.5">
          <CheckSquare size={15} className="text-gold" />
          <span>{t("title")}</span>
        </span>
        <span className="text-tiny text-neutral-400">
          {checklist.length}{" "}
          {checklist.length === 1 ? t("itemSingular") : t("itemPlural")}
        </span>
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
          className="flex-1 bg-card border border-neutral-600 hover:border-neutral-500 rounded-lg px-3 py-1.5 text-neutral-50 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 shadow-xs focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:bg-primary-dark/20 dark:border-primary/30 dark:hover:border-primary/50 dark:shadow-none dark:focus:border-gold dark:focus:ring-1 dark:focus:ring-gold transition-colors text-body-s"
          disabled={isPending}
        />
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
        <ul className="flex flex-col gap-1.5 overflow-y-auto custom-scrollbar mt-1 flex-1 min-h-0 max-h-48 md:max-h-none pr-1">
          {checklist.map((item, idx) => {
            const isEditingThis = editingIndex === idx;
            return (
              <li
                key={item.id || `item-${idx}-${item.name}`}
                className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-surface/70 border border-neutral-700 dark:bg-background/40 dark:border-primary/20 text-body-s text-neutral-200 group/item"
              >
                {isEditingThis ? (
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <input
                      ref={editInputRef}
                      type="text"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleConfirmEdit();
                        }
                        if (e.key === "Escape") {
                          e.preventDefault();
                          handleCancelEdit();
                        }
                      }}
                      onBlur={handleConfirmEdit}
                      className="flex-1 bg-card border border-primary/50 rounded px-2 py-0.5 text-body-s text-neutral-50 focus:outline-none focus:border-primary dark:bg-background/60 dark:border-gold/60 dark:focus:border-gold min-w-0"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => handleToggleChecklistItem(idx)}
                      disabled={isPending}
                      className={cn(
                        "w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer shrink-0",
                        item.isCompleted
                          ? "bg-gold border-gold text-on-gold dark:shadow-glow-gold-xs"
                          : "border-neutral-500 bg-card hover:border-primary dark:border-primary/50 dark:bg-primary-dark/40 dark:hover:border-gold",
                      )}
                      aria-label={
                        item.isCompleted
                          ? t("markPendingAria")
                          : t("markCompletedAria")
                      }
                    >
                      {item.isCompleted && (
                        <Check size={11} className="stroke-3 text-on-gold" />
                      )}
                    </button>
                    <span
                      className={cn(
                        "truncate",
                        item.isCompleted && "line-through text-neutral-400",
                      )}
                    >
                      {item.name}
                    </span>
                  </div>
                )}

                {!isEditingThis && (
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(idx, item.name)}
                      disabled={isPending}
                      className="text-neutral-400 hover:text-primary dark:hover:text-gold p-1 rounded transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                      aria-label={t("editItemAria", { name: item.name ?? "" })}
                      title={t("editItemAria", { name: item.name ?? "" })}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveChecklistItem(idx)}
                      disabled={isPending}
                      className="text-neutral-400 hover:text-danger-500 p-1 rounded transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                      aria-label={t("removeItemAria", {
                        name: item.name ?? "",
                      })}
                      title={t("removeItemAria", { name: item.name ?? "" })}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
