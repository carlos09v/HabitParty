import {
  ArrowRightLeft,
  CheckCircle2,
  Layers,
  ListTodo,
  Loader2,
  Plus,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { memo, type ReactNode } from "react";
import type { FocusActiveTarget } from "@/types/focus";
import { resolveLinkedTask } from "@/utils/focusFormatters";

interface FocusStageTaskSlotProps {
  target: FocusActiveTarget | null;
  isSessionIdle?: boolean;
  isCompletingLinkedTask?: boolean;
  onOpenLinkTask: () => void;
  onOpenLinkActivity: () => void;
  onCompleteLinkedTask: (taskId: string, taskName?: string) => void;
  onUnlinkTask: () => void;
}

const ICON_ACTION_SIZE_CLASSES =
  "min-w-8 min-h-8 pointer-coarse:min-w-11 pointer-coarse:min-h-11 rounded-md inline-flex items-center justify-center transition-colors";

interface LinkedTaskBarProps {
  taskTitle: string;
  taskId?: string;
  borderClassName: string;
  isCompletingLinkedTask: boolean;
  completeLabel: string;
  unlinkLabel: string;
  canUnlink: boolean;
  onCompleteLinkedTask: (taskId: string, taskName?: string) => void;
  onUnlinkTask: () => void;
  extraAction?: ReactNode;
}

function LinkedTaskBar({
  taskTitle,
  taskId,
  borderClassName,
  isCompletingLinkedTask,
  completeLabel,
  unlinkLabel,
  canUnlink,
  onCompleteLinkedTask,
  onUnlinkTask,
  extraAction,
}: LinkedTaskBarProps) {
  return (
    <div
      className={`w-full min-h-[38px] rounded-lg border ${borderClassName} bg-surface/65 dark:bg-surface/60 px-2.5 py-1 flex items-center justify-between gap-2`}
    >
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        <ListTodo
          size={13}
          className="text-primary dark:text-gold shrink-0"
          aria-hidden="true"
        />
        <span
          className="text-xs font-semibold text-neutral-100 truncate"
          title={taskTitle}
        >
          {taskTitle}
        </span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {taskId && (
          <button
            type="button"
            disabled={isCompletingLinkedTask}
            onClick={() => onCompleteLinkedTask(taskId, taskTitle)}
            title={completeLabel}
            aria-label={completeLabel}
            className={`${ICON_ACTION_SIZE_CLASSES} bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {isCompletingLinkedTask ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <CheckCircle2 size={13} />
            )}
          </button>
        )}

        {extraAction}

        {canUnlink && (
          <button
            type="button"
            onClick={onUnlinkTask}
            title={unlinkLabel}
            aria-label={unlinkLabel}
            className={`${ICON_ACTION_SIZE_CLASSES} bg-card/80 dark:bg-surface hover:bg-red-500/20 border border-neutral-700 dark:border-primary/30 hover:border-red-500/40 text-neutral-400 hover:text-red-400 cursor-pointer`}
          >
            <X size={12} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Painel de tarefa vinculada posicionado na coluna principal de ações do Hero de Foco
 * (logo abaixo de Começar / Salvar Tempo Parcial) para alta visibilidade e acesso rápido.
 */
export const FocusStageTaskSlot = memo(function FocusStageTaskSlot({
  target,
  isSessionIdle = true,
  isCompletingLinkedTask = false,
  onOpenLinkTask,
  onOpenLinkActivity,
  onCompleteLinkedTask,
  onUnlinkTask,
}: FocusStageTaskSlotProps) {
  const t = useTranslations("focus.hero");

  if (!target || target.type === "inventory") {
    return null;
  }

  const { taskId, taskName } = resolveLinkedTask(target);

  // 1. Foco direto em uma Tarefa (barra horizontal compacta)
  if (target.type === "task") {
    return (
      <LinkedTaskBar
        taskTitle={taskName || target.name}
        taskId={taskId}
        borderClassName="border-primary/30 dark:border-primary/40"
        isCompletingLinkedTask={isCompletingLinkedTask}
        completeLabel={t("completeLinkedTask")}
        unlinkLabel={t("unlinkTask")}
        canUnlink={isSessionIdle}
        onCompleteLinkedTask={onCompleteLinkedTask}
        onUnlinkTask={onUnlinkTask}
        extraAction={
          <button
            type="button"
            onClick={onOpenLinkActivity}
            title={t("linkActivityTooltip")}
            aria-label={t("linkActivityButton")}
            className="min-h-8 pointer-coarse:min-h-11 px-2.5 rounded-md inline-flex items-center gap-1 bg-amber-500/10 dark:bg-gold/15 hover:bg-amber-500/20 dark:hover:bg-gold/25 border border-amber-500/40 dark:border-gold/45 text-amber-800 dark:text-gold text-[11px] font-bold transition-colors cursor-pointer"
          >
            <Layers size={12} aria-hidden="true" />
            <span className="truncate max-w-[92px]">
              {t("linkActivityShort")}
            </span>
          </button>
        }
      />
    );
  }

  // 2. Atividade com Tarefa Vinculada (barra horizontal compacta)
  if (target.type === "activity" && taskId && taskName) {
    return (
      <LinkedTaskBar
        taskTitle={taskName}
        taskId={taskId}
        borderClassName="border-primary/35 dark:border-primary-light/40"
        isCompletingLinkedTask={isCompletingLinkedTask}
        completeLabel={t("completeLinkedTask")}
        unlinkLabel={t("unlinkTask")}
        canUnlink={true}
        onCompleteLinkedTask={onCompleteLinkedTask}
        onUnlinkTask={onUnlinkTask}
        extraAction={
          <button
            type="button"
            onClick={onOpenLinkTask}
            title={t("switchLinkedTask")}
            aria-label={t("switchLinkedTask")}
            className={`${ICON_ACTION_SIZE_CLASSES} bg-card/80 dark:bg-surface hover:bg-amber-500/15 dark:hover:bg-gold/15 border border-neutral-700 dark:border-primary/30 hover:border-amber-500/45 dark:hover:border-gold/45 text-neutral-300 hover:text-amber-700 dark:hover:text-gold cursor-pointer`}
          >
            <ArrowRightLeft size={12} aria-hidden="true" />
          </button>
        }
      />
    );
  }

  // 3. Atividade sem Tarefa Vinculada (barra horizontal compacta)
  if (target.type === "activity") {
    return (
      <button
        type="button"
        onClick={onOpenLinkTask}
        title={t("linkTaskTooltip")}
        className="w-full min-h-[38px] py-1.5 px-2.5 rounded-lg border border-dashed border-amber-500/45 dark:border-gold/40 bg-amber-500/5 dark:bg-gold/5 hover:bg-amber-500/15 dark:hover:bg-gold/15 hover:border-amber-500/75 dark:hover:border-gold/70 text-amber-800 dark:text-gold text-xs font-bold flex items-center justify-between gap-2 transition-colors cursor-pointer"
      >
        <span className="flex items-center gap-1.5 min-w-0">
          <ListTodo size={14} className="shrink-0" aria-hidden="true" />
          <span className="truncate">{t("linkTaskButton")}</span>
        </span>
        <Plus size={13} className="shrink-0 opacity-80" aria-hidden="true" />
      </button>
    );
  }

  return null;
});
