import { ListTodo, type LucideIcon, Timer } from "lucide-react";
import { getFocusIcon } from "@/constants/focus";
import type { FocusActiveTarget, FocusRecord } from "@/types/focus";
import { getRewardIcon } from "@/utils/rewardMapper";

/**
 * Resolve o ícone Lucide adequado para o alvo ativo do timer de foco
 * (item da mochila, tarefa direta ou atividade).
 */
export function resolveFocusTargetIcon(
  target?: Pick<FocusActiveTarget, "type" | "icon"> | null,
): LucideIcon {
  if (!target) return Timer;
  if (target.type === "inventory") {
    return getRewardIcon(target.icon, "TimeBased");
  }
  if (target.type === "task") {
    return ListTodo;
  }
  return target.icon ? getFocusIcon(target.icon) : Timer;
}

export interface ResolvedFocusRecordDisplay {
  title: string;
  subtitle?: string;
  IconComp: LucideIcon;
}

/**
 * Normaliza título, subtítulo e ícone exibidos para um FocusRecord no histórico,
 * popover de detalhes e histórico por tarefa, cobrindo atividades, tarefas avulsas e cupons da mochila.
 */
export function resolveFocusRecordDisplay(
  record: Pick<
    FocusRecord,
    | "activityName"
    | "activityIcon"
    | "taskNameSnapshot"
    | "itemName"
    | "itemIcon"
    | "inventoryItemId"
    | "taskId"
  >,
  fallbackTitle: string,
): ResolvedFocusRecordDisplay {
  let IconComp: LucideIcon = Timer;
  if (record.inventoryItemId) {
    IconComp = getRewardIcon(record.itemIcon, "TimeBased");
  } else if (record.activityIcon) {
    IconComp = getFocusIcon(record.activityIcon);
  } else if (record.taskId || record.taskNameSnapshot) {
    IconComp = ListTodo;
  }

  const title =
    record.activityName ||
    record.taskNameSnapshot ||
    record.itemName ||
    fallbackTitle;

  const subtitle =
    record.activityName && record.taskNameSnapshot
      ? record.taskNameSnapshot
      : undefined;

  return { title, subtitle, IconComp };
}
