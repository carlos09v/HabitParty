import type { FocusRecord } from "@/types/focus";

export interface ResolvedFocusRecordText {
  title: string;
  subtitle?: string;
}

/**
 * Resolve título e subtítulo de exibição de um FocusRecord sem importar ícones Lucide.
 * Ideal para listas e modais que não renderizam ícones de atividade/recompensa.
 */
export function resolveFocusRecordTitle(
  record: Pick<FocusRecord, "activityName" | "taskNameSnapshot" | "itemName">,
  fallbackTitle: string,
): ResolvedFocusRecordText {
  const title =
    record.activityName ||
    record.taskNameSnapshot ||
    record.itemName ||
    fallbackTitle;

  const subtitle =
    record.activityName && record.taskNameSnapshot
      ? record.taskNameSnapshot
      : undefined;

  return { title, subtitle };
}
