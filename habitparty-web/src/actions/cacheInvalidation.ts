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
    // Showcase já compartilha a tag "user", então mantemos invalidação consistente.
    updateTag("showcase");
  }
}

export interface InvalidateFocusDomainOptions {
  activities?: boolean;
  records?: boolean;
  rewardsAndInventory?: boolean;
  tasks?: boolean;
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
    updateTag("showcase");
  }
  if (options.rewardsAndInventory) {
    updateTag("inventory");
    updateTag("user");
    updateTag("transactions");
    updateTag("showcase");
  }
  if (options.tasks) {
    updateTag("tasks");
    updateTag("dashboard-tasks");
    updateTag("kanban");
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
    updateTag("showcase");
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
    updateTag("showcase");
  }
}

/**
 * Invalida as tags de cache RSC da Vitrine de Perfil e Conquistas (/profile).
 */
export function invalidateShowcaseDomainTags(includeUser = false) {
  updateTag("showcase");
  if (includeUser) {
    updateTag("user");
  }
}

/**
 * Invalida as tags de cache RSC do Painel Administrativo (/admin).
 */
export function invalidateAdminDomainTags() {
  updateTag("admin-overview");
  updateTag("admin-users");
}
