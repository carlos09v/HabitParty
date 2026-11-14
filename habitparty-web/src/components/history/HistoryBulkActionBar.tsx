"use client";

import { Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { cn } from "@/utils";

interface HistoryBulkActionBarProps {
  selectedCount: number;
  isAllSelected: boolean;
  isPartiallySelected: boolean;
  isCompact?: boolean;
  onToggleSelectAll: () => void;
  onClearSelection: () => void;
  onOpenBulkDeleteModal: () => void;
}

export function HistoryBulkActionBar({
  selectedCount,
  isAllSelected,
  isPartiallySelected,
  isCompact = false,
  onToggleSelectAll,
  onClearSelection,
  onOpenBulkDeleteModal,
}: HistoryBulkActionBarProps) {
  const t = useTranslations("history.table");
  const selectAllRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = isPartiallySelected;
    }
  }, [isPartiallySelected]);

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 flex-wrap rounded-xl border transition-colors",
        isCompact ? "px-3 py-1.5" : "px-4 py-2",
        selectedCount > 0
          ? "border-gold/45 bg-gold/10 dark:border-gold/35 dark:bg-gold/8 shadow-2xs"
          : "border-neutral-700/70 bg-card/60 dark:border-primary/20 dark:bg-primary-dark/15",
      )}
    >
      <label className="inline-flex items-center gap-2.5 text-xs font-semibold text-neutral-200 hover:text-neutral-50 cursor-pointer select-none py-0.5">
        <input
          ref={selectAllRef}
          type="checkbox"
          checked={isAllSelected}
          onChange={onToggleSelectAll}
          aria-label={t("headers.selectAllAria")}
          className="checkbox-custom"
        />
        <span className={cn(selectedCount > 0 && "text-gold font-bold")}>
          {selectedCount > 0
            ? t("bulk.selectedCount", { count: selectedCount })
            : t("bulk.selectAll")}
        </span>
      </label>

      {selectedCount > 0 && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClearSelection}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-neutral-300 hover:bg-surface-hover dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={13} aria-hidden="true" />
            {t("bulk.clearSelection")}
          </button>
          <button
            type="button"
            onClick={onOpenBulkDeleteModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white shadow-xs transition-colors cursor-pointer"
          >
            <Trash2 size={13} aria-hidden="true" />
            {t("bulk.deleteSelected", { count: selectedCount })}
          </button>
        </div>
      )}
    </div>
  );
}
