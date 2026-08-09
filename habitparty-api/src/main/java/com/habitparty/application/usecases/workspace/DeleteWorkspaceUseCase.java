package com.habitparty.application.usecases.workspace;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.habitparty.application.ports.WorkspaceRepository;
import com.habitparty.core.domain.entities.Workspace;
import com.habitparty.core.exceptions.WorkspaceNotFoundExeption;

@Service
public class DeleteWorkspaceUseCase {
    private final WorkspaceRepository port;

    public DeleteWorkspaceUseCase(WorkspaceRepository port) {
        this.port = port;
    }

    public void execute(UUID workspaceId, UUID userIdLogado) {
        // 1. Busca o Workspace e verifica se existe
        Workspace workspace = port.findById(workspaceId)
                .orElseThrow(() -> new WorkspaceNotFoundExeption("Workspace não encontrado!"));

        // 2. Verifica se o usuário logado é o dono desse workspace (Segurança)
        workspace.validateOwnership(userIdLogado);

        // Pra depois: garantir que ao deletar isso, tambem delete Board_Columns e Tasks
        port.deleteById(workspaceId);
    }
}
