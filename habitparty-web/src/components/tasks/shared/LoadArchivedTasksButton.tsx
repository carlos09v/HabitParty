"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { cn } from "@/utils";

interface LoadArchivedTasksButtonProps {
  columnId: string;
  archivedCompletedCount: number;
  onLoadArchivedCompleted: (columnId: string) => Promise<void>;
  className?: string;
}

/**
 * Botão compartilhado para carregar sob demanda To-Dos concluídos arquivados
 * de uma coluna, reutilizado em `RoutineColumn` (Cards) e `RoutineTaskList` (Lista).
 */
export function LoadArchivedTasksButton({
  columnId,
  archivedCompletedCount,
  onLoadArchivedCompleted,
  className,
}: LoadArchivedTasksButtonProps) {
  const t = useTranslations("tasks.column");
  const [isLoading, setIsLoading] = useState(false);

  if (archivedCompletedCount <= 0) return null;

  const handleClick = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await onLoadArchivedCompleted(columnId);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      disabled={isLoading}
      onClick={handleClick}
      className={cn(
        "w-full flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-neutral-700/70 dark:border-white/10 text-neutral-400 hover:text-gold hover:border-gold/40 hover:bg-gold/5 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait px-3 py-2 text-xs",
        className,
      )}
    >
      {isLoading ? (
        <>
          <Loader2
            size={13}
            className="animate-spin shrink-0"
            aria-hidden="true"
          />
          <span>{t("loadingArchivedCompleted")}</span>
        </>
      ) : (
        <span>
          {t("loadArchivedCompleted", {
            count: archivedCompletedCount,
          })}
        </span>
      )}
    </button>
  );
}
