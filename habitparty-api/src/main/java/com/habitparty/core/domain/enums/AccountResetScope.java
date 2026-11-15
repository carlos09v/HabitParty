package com.habitparty.core.domain.enums;

/**
 * Escopo de redefinição (reset) da conta sem exclusão do cadastro principal.
 */
public enum AccountResetScope {
  /**
   * Zera apenas métricas, XP, moedas, sequências, conquistas, destaques, histórico de transações
   * e registros/contadores de foco e streaks das tarefas, preservando workspaces, colunas, tarefas,
   * recompensas e atividades de foco.
   */
  METRICS,

  /**
   * Remove todo o conteúdo criado pelo usuário (workspaces, colunas, tarefas, recompensas,
   * inventário, atividades/registros de foco, transações, conquistas, destaques e notificações)
   * e zera todas as métricas e cosméticos de vitrine, mantendo conta, login e assinatura ativos.
   */
  COMPLETE
}
