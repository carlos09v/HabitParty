"use client";

import { Check, Pencil, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChecklistItem } from "@/types/task";
import { cn } from "@/utils";

export function useChecklistInlineEdit<K extends string | number>(
  onConfirm: (key: K, newName: string) => void,
  disabled = false,
) {
  const [editingKey, setEditingKey] = useState<K | null>(null);
  const [editingText, setEditingText] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingKey !== null) {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }
  }, [editingKey]);

  const startEdit = useCallback(
    (key: K, currentName?: string) => {
      if (disabled) return;
      setEditingKey(key);
      setEditingText(currentName || "");
    },
    [disabled],
  );

  const confirmEdit = useCallback(() => {
    if (editingKey !== null) {
      const trimmed = editingText.trim();
      if (trimmed) {
        onConfirm(editingKey, trimmed);
      }
      setEditingKey(null);
      setEditingText("");
    }
  }, [editingKey, editingText, onConfirm]);

  const cancelEdit = useCallback(() => {
    setEditingKey(null);
    setEditingText("");
  }, []);

  return {
    editingKey,
    editingText,
    setEditingText,
    editInputRef,
    startEdit,
    confirmEdit,
    cancelEdit,
  };
}

export interface ChecklistItemRowProps {
  item: ChecklistItem;
  variant?: "popover" | "modal";
  isEditing: boolean;
  editingText: string;
  editInputRef: React.RefObject<HTMLInputElement | null>;
  disabled?: boolean;
  onEditingTextChange: (value: string) => void;
  onConfirmEdit: () => void;
  onCancelEdit: () => void;
  onStartEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  labels: {
    editAria: string;
    deleteAria: string;
    toggleAria?: string;
  };
}

/**
 * Linha compartilhada de item de checklist com suporte a edição inline,
 * conclusão rápida e botões de ação acessíveis por teclado e toque.
 */
export function ChecklistItemRow({
  item,
  variant = "popover",
  isEditing,
  editingText,
  editInputRef,
  disabled = false,
  onEditingTextChange,
  onConfirmEdit,
  onCancelEdit,
  onStartEdit,
  onToggle,
  onDelete,
  labels,
}: ChecklistItemRowProps) {
  const isModal = variant === "modal";
  const Tag = isModal ? "li" : "div";

  return (
    <Tag
      className={cn(
        "flex items-center justify-between gap-2 group/item transition-colors",
        isModal
          ? "px-2.5 py-1.5 rounded-lg bg-surface/70 border border-neutral-700 dark:bg-background/40 dark:border-primary/20 text-body-s text-neutral-200"
          : "py-1 px-1 rounded-md hover:bg-surface/70 dark:hover:bg-white/4",
      )}
    >
      {isEditing ? (
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <input
            ref={editInputRef}
            type="text"
            value={editingText}
            onChange={(e) => onEditingTextChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onConfirmEdit();
              }
              if (e.key === "Escape") {
                e.preventDefault();
                onCancelEdit();
              }
            }}
            onBlur={onConfirmEdit}
            className={cn(
              "flex-1 bg-card border border-primary/50 rounded text-neutral-50 focus:outline-none focus:border-primary dark:bg-background/60 dark:border-gold/60 dark:focus:border-gold min-w-0",
              isModal ? "px-2 py-0.5 text-body-s" : "px-1.5 py-0.5 text-xs",
            )}
          />
        </div>
      ) : isModal ? (
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            type="button"
            onClick={onToggle}
            disabled={disabled}
            className={cn(
              "w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer shrink-0",
              item.isCompleted
                ? "bg-gold border-gold text-on-gold dark:shadow-glow-gold-xs"
                : "border-neutral-500 bg-card hover:border-primary dark:border-primary/50 dark:bg-primary-dark/40 dark:hover:border-gold",
            )}
            aria-label={labels.toggleAria}
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
      ) : (
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer group/toggle focus:outline-none"
        >
          <span
            className={cn(
              "w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors shrink-0",
              item.isCompleted
                ? "bg-gold border-gold text-on-gold"
                : "border-neutral-500 bg-card group-hover/toggle:border-primary dark:border-primary/50 dark:bg-primary-dark/40 dark:group-hover/toggle:border-gold",
            )}
          >
            {item.isCompleted && <Check size={9} className="stroke-3" />}
          </span>
          <span
            className={cn(
              "text-xs text-neutral-200 truncate transition-colors group-hover/toggle:text-neutral-50",
              item.isCompleted &&
                "line-through text-neutral-400 dark:text-neutral-500 group-hover/toggle:text-neutral-300 dark:group-hover/toggle:text-neutral-400",
            )}
          >
            {item.name}
          </span>
        </button>
      )}

      {!isEditing && (
        <div
          className={cn(
            "flex items-center gap-0.5 shrink-0",
            !isModal &&
              "sm:opacity-0 sm:group-hover/item:opacity-100 focus-within:opacity-100 transition-opacity",
          )}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onStartEdit();
            }}
            disabled={disabled}
            className={cn(
              "rounded text-neutral-400 dark:text-neutral-500 hover:text-primary dark:hover:text-gold transition-colors cursor-pointer disabled:opacity-50 shrink-0",
              isModal ? "p-1" : "p-0.5",
            )}
            aria-label={labels.editAria}
            title={labels.editAria}
          >
            <Pencil size={isModal ? 13 : 11} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            disabled={disabled}
            className={cn(
              "rounded text-neutral-400 dark:text-neutral-500 hover:text-danger-500 transition-colors cursor-pointer disabled:opacity-50 shrink-0",
              isModal ? "p-1" : "p-0.5",
            )}
            aria-label={labels.deleteAria}
            title={labels.deleteAria}
          >
            <Trash2 size={isModal ? 14 : 12} />
          </button>
        </div>
      )}
    </Tag>
  );
}
