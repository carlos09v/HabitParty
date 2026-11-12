package com.habitparty.application.ports.projections;

import java.util.UUID;

/**
 * Resultado agregado da busca de tarefas entre workspaces:
 * quantas tarefas correspondem ao termo em cada workspace do usuário.
 */
public record TaskSearchWorkspaceCountDTO(
    UUID workspaceId,
    String workspaceName,
    long count
) {
}
