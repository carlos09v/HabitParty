package com.habitparty.application.usecases.workspace;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.habitparty.adapters.in.web.dtos.request.CreateWorkspaceDTO;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.ports.WorkspaceRepository;
import com.habitparty.core.domain.entities.Workspace;
import com.habitparty.core.exceptions.UserNotFoundException;
import com.habitparty.core.exceptions.WorkspaceLimitExceededException;

@Service
public class CreateWorkspaceUseCase {
  private final WorkspaceRepository workspacePort;
  private final UserRepository userPort;

  public CreateWorkspaceUseCase(WorkspaceRepository workspacePort, UserRepository userPort) {
    this.workspacePort = workspacePort;
    this.userPort = userPort;
  }

  public Workspace execute(CreateWorkspaceDTO dto, UUID userIdLogado) {
    // Verificar se o user existe.
    userPort.findById(userIdLogado) // <-- Usa o ID confiável do Backend!
      .orElseThrow(() -> new UserNotFoundException("Usuário não encontrado!"));

    // Limite de Workspaces do Plano Free
    int currentCount = workspacePort.countByUserId(userIdLogado);
    if (currentCount >= 2) {
        throw new WorkspaceLimitExceededException("Limite de 2 workspaces atingido no plano gratuito.");
    }

    // Liberado pra salvar no DB
    Workspace newWorkspace = new Workspace(
      UUID.randomUUID(),
      userIdLogado,
      dto.name()
    );

    return workspacePort.save(newWorkspace);
  }
}
