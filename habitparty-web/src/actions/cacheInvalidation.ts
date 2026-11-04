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

export interface InvalidateFocusDomainOptions {
  activities?: boolean;
  records?: boolean;
  rewardsAndInventory?: boolean;
}

/**
 * Invalida de forma unificada as tags de cache RSC do domínio de Foco.
 */
export function invalidateFocusDomainTags(
  options: InvalidateFocusDomainOptions = {},
) {
  if (options.activities) {
    updateTag("focus-activities");
  }
  if (options.records) {
    updateTag("focus-records");
  }
  if (options.rewardsAndInventory) {
    updateTag("inventory");
    updateTag("user");
    updateTag("transactions");
  }
}

/**
 * Invalida de forma unificada as tags de cache RSC do domínio de Recompensas (Vitrine/Loja).
 */
export function invalidateRewardDomainTags(includeUserAndInventory = false) {
  updateTag("rewards");
  if (includeUserAndInventory) {
    updateTag("inventory");
    updateTag("user");
    updateTag("transactions");
  }
}

/**
 * Invalida de forma unificada as tags de cache RSC do domínio de Inventário/Mochila.
 */
export function invalidateInventoryDomainTags(
  includeFocus = false,
  includeUserAndTransactions = false,
) {
  updateTag("inventory");
  if (includeFocus) {
    updateTag("focus-activities");
    updateTag("focus-records");
  }
  if (includeUserAndTransactions) {
    updateTag("user");
    updateTag("transactions");
  }
}
