"use client";

import {
  ArrowRightLeft,
  CheckCircle2,
  Layers,
  ListTodo,
  Plus,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { memo } from "react";
import type { FocusActiveTarget } from "@/types/focus";

interface FocusStageTaskSlotProps {
  target: FocusActiveTarget | null;
  isInventoryItem: boolean;
  onOpenLinkTask: () => void;
  onOpenLinkActivity: () => void;
  onCompleteLinkedTask: (taskId: string, taskName?: string) => void;
  onUnlinkTask: () => void;
}

/**
 * Painel de tarefa vinculada posicionado na coluna principal de ações do Hero de Foco
 * (logo abaixo de Começar / Salvar Tempo Parcial) para alta visibilidade e acesso rápido.
 */
export const FocusStageTaskSlot = memo(function FocusStageTaskSlot({
  target,
  isInventoryItem,
  onOpenLinkTask,
  onOpenLinkActivity,
  onCompleteLinkedTask,
  onUnlinkTask,
}: FocusStageTaskSlotProps) {
  const t = useTranslations("focus.hero");

  if (!target || isInventoryItem) {
    return null;
  }

  // 1. Foco direto em uma Tarefa (com atalho para vincular a uma Atividade Macro)
  if (target.type === "task") {
    return (
      <div className="w-full rounded-xl border border-primary/30 dark:border-primary/40 bg-surface/70 dark:bg-surface/60 px-3 py-2 flex flex-col gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <ListTodo
            size={13}
            className="text-primary dark:text-gold shrink-0"
          />
          <span className="text-[11px] font-bold text-neutral-200 truncate">
            {t("taskSessionBadge")}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {target.taskId && (
            <button
              type="button"
              onClick={() =>
                onCompleteLinkedTask(
                  target.taskId as string,
                  target.taskName || target.name,
                )
              }
              title={t("completeLinkedTask")}
              className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-colors cursor-pointer"
            >
              <CheckCircle2 size={13} />
              <span>{t("completeLinkedTaskShort")}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenLinkActivity}
            title={t("linkActivityTooltip")}
            className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 dark:bg-gold/15 hover:bg-amber-500/20 dark:hover:bg-gold/25 border border-amber-500/40 dark:border-gold/45 text-amber-800 dark:text-gold text-xs font-bold transition-colors cursor-pointer"
          >
            <Layers size={13} />
            <span className="truncate">{t("linkActivityButton")}</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. Atividade com Tarefa Vinculada
  if (target.type === "activity" && target.taskId && target.taskName) {
    return (
      <div className="w-full rounded-xl border border-primary/35 dark:border-primary-light/40 bg-surface/75 dark:bg-surface/65 px-3 py-2 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <ListTodo
              size={14}
              className="text-primary dark:text-gold shrink-0"
            />
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400 leading-none">
                {t("linkedTaskLabel")}
              </span>
              <span
                className="text-xs font-bold text-neutral-100 truncate mt-0.5"
                title={target.taskName}
              >
                {target.taskName}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onUnlinkTask}
            title={t("unlinkTask")}
            aria-label={t("unlinkTask")}
            className="w-6 h-6 rounded-lg flex items-center justify-center bg-card/80 dark:bg-surface hover:bg-red-500/20 border border-neutral-700 dark:border-primary/30 hover:border-red-500/40 text-neutral-400 hover:text-red-400 transition-colors cursor-pointer shrink-0"
          >
            <X size={13} />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() =>
              onCompleteLinkedTask(target.taskId as string, target.taskName)
            }
            title={t("completeLinkedTask")}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-colors cursor-pointer"
          >
            <CheckCircle2 size={13} />
            <span>{t("completeLinkedTaskShort")}</span>
          </button>

          <button
            type="button"
            onClick={onOpenLinkTask}
            title={t("switchLinkedTask")}
            aria-label={t("switchLinkedTask")}
            className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-card/80 dark:bg-surface hover:bg-amber-500/15 dark:hover:bg-gold/15 border border-neutral-700 dark:border-primary/30 hover:border-amber-500/45 dark:hover:border-gold/45 text-neutral-300 hover:text-amber-700 dark:hover:text-gold text-xs font-semibold transition-colors cursor-pointer shrink-0"
          >
            <ArrowRightLeft size={12} />
            <span>{t("switchTarget")}</span>
          </button>
        </div>
      </div>
    );
  }

  // 3. Atividade sem Tarefa Vinculada
  if (target.type === "activity") {
    return (
      <button
        type="button"
        onClick={onOpenLinkTask}
        title={t("linkTaskTooltip")}
        className="w-full py-2 px-3.5 rounded-xl border border-dashed border-amber-500/45 dark:border-gold/40 bg-amber-500/5 dark:bg-gold/5 hover:bg-amber-500/15 dark:hover:bg-gold/15 hover:border-amber-500/75 dark:hover:border-gold/70 text-amber-800 dark:text-gold text-xs font-bold flex items-center justify-between gap-2 transition-colors cursor-pointer"
      >
        <span className="flex items-center gap-2 min-w-0">
          <ListTodo size={15} className="shrink-0" />
          <span className="truncate">{t("linkTaskButton")}</span>
        </span>
        <Plus size={14} className="shrink-0 opacity-80" />
      </button>
    );
  }

  return null;
});
