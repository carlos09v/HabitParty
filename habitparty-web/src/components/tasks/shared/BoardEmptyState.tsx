import { CalendarCheck, Columns3, Eye, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

export type BoardEmptyStateVariant =
  | "no_columns"
  | "all_hidden"
  | "no_filter_matches";

interface BoardEmptyStateProps {
  variant: BoardEmptyStateVariant;
  isReadOnly?: boolean;
  onAddColumn?: () => void;
  onManageColumns?: () => void;
  onClearFilters?: () => void;
}

/**
 * Estado vazio unificado para o Quadro de Tarefas (Visualização em Cards e em Lista):
 * - `no_columns`: ambiente sem listas criadas (com CTA de criação quando editável).
 * - `all_hidden`: todas as listas ocultas (com CTA para gerenciar/exibir colunas).
 * - `no_filter_matches`: filtros/busca sem resultados (com CTA "Limpar filtros").
 */
export function BoardEmptyState({
  variant,
  isReadOnly = false,
  onAddColumn,
  onManageColumns,
  onClearFilters,
}: BoardEmptyStateProps) {
  const tBoard = useTranslations("tasks.board");
  const tList = useTranslations("tasks.taskList");
  const tFilters = useTranslations("tasks.filters");
  const tColumnsDrawer = useTranslations("tasks.columnsDrawer");

  if (variant === "no_columns") {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center text-center p-6 sm:p-12">
        <div className="max-w-md w-full flex flex-col items-center gap-4 p-8 rounded-2xl border border-dashed border-primary/35 bg-primary-dark/20">
          <div className="w-16 h-16 rounded-2xl bg-gold/15 border border-gold/30 flex items-center justify-center text-gold shadow-glow-gold-xs">
            <Columns3 size={32} aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-1.5 items-center">
            <h3 className="text-lg font-bold text-neutral-100">
              {tBoard("noColumnsTitle")}
            </h3>
            <p className="text-sm text-neutral-400 max-w-sm">
              {tBoard("noColumnsDescription")}
            </p>
          </div>
          {onAddColumn && !isReadOnly && (
            <button
              type="button"
              onClick={onAddColumn}
              className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold hover:bg-gold-hover text-on-gold font-bold text-sm shadow-glow-gold-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              <Plus size={16} aria-hidden="true" />
              <span>{tBoard("createFirstColumnButton")}</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  if (variant === "all_hidden") {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center text-center p-6">
        <div className="max-w-md w-full flex flex-col items-center gap-3 p-6 rounded-2xl border border-dashed border-neutral-700/80 dark:border-white/15 bg-surface/50 dark:bg-white/5">
          <Columns3 size={28} className="text-neutral-500" aria-hidden="true" />
          <h3 className="text-base font-bold text-neutral-200">
            {tBoard("allHiddenTitle")}
          </h3>
          <p className="text-xs text-neutral-400">
            {tBoard("allHiddenDescription")}
          </p>
          {onManageColumns && (
            <button
              type="button"
              onClick={onManageColumns}
              className="mt-1 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface hover:bg-surface-hover border border-neutral-700 dark:border-white/15 text-xs font-semibold text-neutral-100 hover:text-primary dark:hover:text-gold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70"
            >
              <Eye size={14} aria-hidden="true" />
              <span>{tColumnsDrawer("title")}</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="max-w-md w-full flex flex-col items-center gap-2 p-6 rounded-2xl border border-dashed border-neutral-700/80 dark:border-white/15 bg-primary-dark/10">
        <CalendarCheck
          size={32}
          className="text-amber-700 dark:text-gold mb-1"
          aria-hidden="true"
        />
        <h3 className="text-body-m font-bold text-neutral-200">
          {tList("allClearTitle")}
        </h3>
        <p className="text-body-s text-neutral-400">{tList("allClearDesc")}</p>
        {onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface hover:bg-surface-hover border border-neutral-700 dark:border-white/15 text-xs font-semibold text-neutral-100 hover:text-primary dark:hover:text-gold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70"
          >
            {tFilters("clearAllFilters")}
          </button>
        )}
      </div>
    </div>
  );
}
