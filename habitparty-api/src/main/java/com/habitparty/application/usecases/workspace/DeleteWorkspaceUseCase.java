package com.habitparty.application.usecases.workspace;

import java.util.List;
import java.util.UUID;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.stereotype.Service;

import com.habitparty.application.ports.BoardColumnRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.WorkspaceRepository;
import com.habitparty.core.domain.entities.BoardColumn;
import com.habitparty.core.domain.entities.Workspace;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
@Transactional
public class DeleteWorkspaceUseCase {
    private final WorkspaceRepository port;
    private final BoardColumnRepository boardColumnPort;
    private final TaskRepository taskPort;

    public DeleteWorkspaceUseCase(WorkspaceRepository port,
            BoardColumnRepository boardColumnPort,
            TaskRepository taskPort) {
        this.port = port;
        this.boardColumnPort = boardColumnPort;
        this.taskPort = taskPort;
    }

    public void execute(UUID workspaceId, UUID userIdLogado) {
        // 1. Busca o Workspace e verifica se existe
        Workspace workspace = port.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace não encontrado!"));

        // 2. Verifica se o usuário logado é o dono desse workspace (Segurança)
        workspace.validateOwnership(userIdLogado);

        // 3. Cascata manual bottom-up: checklists/tasks -> board_columns -> workspace
        List<UUID> columnIds = boardColumnPort.findAllByWorkspaceId(workspaceId).stream()
                .map(BoardColumn::getId)
                .toList();

        taskPort.deleteAllByBoardColumnIds(columnIds);
        boardColumnPort.deleteAllByWorkspaceId(workspaceId);
        port.deleteById(workspaceId);
    }
}
