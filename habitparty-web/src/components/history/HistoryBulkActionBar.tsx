import { Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";

interface HistoryBulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onOpenBulkDeleteModal: () => void;
}

/**
 * Barra contextual flutuante exibida somente quando há itens selecionados,
 * evitando ruído visual constante acima da tabela.
 */
export function HistoryBulkActionBar({
  selectedCount,
  onClearSelection,
  onOpenBulkDeleteModal,
}: HistoryBulkActionBarProps) {
  const t = useTranslations("history.table");

  return (
    <>
      <output aria-live="polite" className="sr-only">
        {selectedCount > 0
          ? t("bulk.selectedCount", { count: selectedCount })
          : ""}
      </output>

      {selectedCount > 0 && (
        <section
          aria-label={t("bulk.selectedCount", { count: selectedCount })}
          className="sticky bottom-3 z-30 mx-auto w-full max-w-xl flex items-center justify-between gap-3 rounded-2xl border border-amber-500/45 dark:border-gold/40 bg-popover/95 backdrop-blur-md px-4 py-2.5 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          <span className="text-xs sm:text-sm font-bold text-amber-800 dark:text-gold tabular-nums">
            {t("bulk.selectedCount", { count: selectedCount })}
          </span>

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
        </section>
      )}
    </>
  );
}
