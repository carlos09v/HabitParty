import { updateTag } from "next/cache";

export interface InvalidateTaskDomainOptions {
  includeColumnSummaries?: boolean;
  includeUserAndTransactions?: boolean;
}

/**
 * Invalida de forma unificada as tags de cache RSC de tarefas, colunas e painel (Dashboard + Kanban).
 */
export function invalidateTaskDomainTags(
  options: InvalidateTaskDomainOptions = {},
) {
  updateTag("tasks");
  updateTag("dashboard-tasks");
  updateTag("kanban");

  if (options.includeColumnSummaries) {
    updateTag("dashboard-columns");
    updateTag("board_columns");
  }

  if (options.includeUserAndTransactions) {
    updateTag("user");
    updateTag("transactions");
  }
}
