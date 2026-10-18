package com.habitparty.application.usecases.workspace;

import java.util.UUID;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.stereotype.Service;

import com.habitparty.application.ports.WorkspaceRepository;
import com.habitparty.core.domain.entities.Workspace;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
@Transactional
public class UpdateWorkspaceUseCase  {
  private final WorkspaceRepository port;

  public UpdateWorkspaceUseCase(WorkspaceRepository port) {
    this.port = port;
  }

  public Workspace execute(UUID workspaceId, UpdateWorkspaceCommand command, UUID userIdLogado) {
    return execute(workspaceId, userIdLogado, command.name());
  }

  public Workspace execute(UUID workspaceId, UUID userIdLogado, String name) {
    // 1. Busca o Workspace no banco
    Workspace workspace = port.findById(workspaceId)
        .orElseThrow(() -> new ResourceNotFoundException("Workspace não encontrado!"));

    // 2. Valida se o usuário logado é realmente o dono deste Workspace
    workspace.validateOwnership(userIdLogado);

    // 3. Atualiza o nome através do método de domínio
    workspace.updateName(name);

    // 4. Salva a entidade modificada (O Hibernate fará um UPDATE automaticamente)
    return port.save(workspace);
  }
}
