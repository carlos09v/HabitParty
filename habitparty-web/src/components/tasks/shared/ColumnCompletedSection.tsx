import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { LoadArchivedTasksButton } from "@/components/tasks/shared/LoadArchivedTasksButton";
import { cn } from "@/utils";

interface ColumnCompletedSectionProps {
  columnId: string;
  variant: "card" | "list";
  isExpanded: boolean;
  onToggleExpanded: () => void;
  totalCompletedCount: number;
  archivedCompletedCount: number;
  onLoadArchivedCompleted?: (columnId: string) => Promise<void>;
  children: ReactNode;
}

/**
 * Seção colapsável compartilhada de Afazeres concluídos + carregamento sob demanda de arquivados,
 * usada tanto em `RoutineColumn` (Cards) quanto em `RoutineTaskList` (Lista).
 */
export function ColumnCompletedSection({
  columnId,
  variant,
  isExpanded,
  onToggleExpanded,
  totalCompletedCount,
  archivedCompletedCount,
  onLoadArchivedCompleted,
  children,
}: ColumnCompletedSectionProps) {
  const tColumn = useTranslations("tasks.column");
  const isCard = variant === "card";

  return (
    <div
      className={cn(
        "flex flex-col gap-2 pt-1.5 border-t",
        isCard
          ? "mt-0.5 border-neutral-700/60 dark:border-white/8"
          : "border-neutral-700/50 dark:border-white/6",
      )}
    >
      <button
        type="button"
        onClick={onToggleExpanded}
        aria-expanded={isExpanded}
        className={cn(
          "flex items-center gap-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-white/5 transition-colors cursor-pointer select-none text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60",
          isCard ? "w-full px-2.5 py-1.5" : "w-fit px-2.5 py-1",
        )}
      >
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={cn(
            "shrink-0 transition-transform duration-200",
            !isExpanded && "-rotate-90",
          )}
        />
        <span className="font-semibold">
          {tColumn("completedSectionLabel")}
        </span>
        <span
          className={cn(
            "px-1.5 py-0.5 rounded-full bg-surface dark:bg-white/8 text-neutral-300 font-bold text-tiny leading-none tabular-nums",
            isCard && "ml-auto",
          )}
        >
          {totalCompletedCount}
        </span>
      </button>

      {isExpanded && (
        <div className={cn("flex flex-col", isCard ? "gap-2.5" : "gap-2")}>
          {children}

          {archivedCompletedCount > 0 && onLoadArchivedCompleted && (
            <LoadArchivedTasksButton
              columnId={columnId}
              archivedCompletedCount={archivedCompletedCount}
              onLoadArchivedCompleted={onLoadArchivedCompleted}
            />
          )}
        </div>
      )}
    </div>
  );
}
