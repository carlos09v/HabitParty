package com.habitparty.application.ports.projections;

import java.util.UUID;

/**
 * Projeção escalar enxuta para o seletor de tarefas vinculáveis no Palco de Foco (`/focus`).
 */
public record FocusableTaskDTO(
    UUID id,
    String title,
    String type,
    String columnTitle,
    String workspaceName,
    int totalFocusMinutes,
    int focusCyclesCount,
    boolean completed
) {}
