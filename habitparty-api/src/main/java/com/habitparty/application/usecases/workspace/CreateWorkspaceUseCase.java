package com.habitparty.application.usecases.workspace;

import java.util.UUID;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.stereotype.Service;

import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.ports.WorkspaceRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.Workspace;
import com.habitparty.core.exceptions.LimitExceededException;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
@Transactional
public class CreateWorkspaceUseCase {
  private final WorkspaceRepository workspacePort;
  private final UserRepository userPort;

  public CreateWorkspaceUseCase(WorkspaceRepository workspacePort, UserRepository userPort) {
    this.workspacePort = workspacePort;
    this.userPort = userPort;
  }

  public Workspace execute(CreateWorkspaceCommand command, UUID userIdLogado) {
    return execute(userIdLogado, command.name());
  }

  public Workspace execute(UUID userIdLogado, String name) {
    // Verificar se o user existe.
    User user = userPort.findById(userIdLogado)
      .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado!"));

    // 2. Limite dinâmico: 4 para Premium, 2 para Free
    int limit = user.isPremium() ? 4 : 2;
    int currentCount = workspacePort.countByUserId(userIdLogado);
    
    if (currentCount >= limit) {
        throw new LimitExceededException(
            "Limite de " + limit + " ambientes atingido. " +
            (user.isPremium() ? "Você atingiu o teto máximo do aplicativo." : "Assine o plano Premium para criar até 4 ambientes!")
        );
    }

    // Liberado pra salvar no DB
    Workspace newWorkspace = new Workspace(
      UUID.randomUUID(),
      userIdLogado,
      name
    );

    return workspacePort.save(newWorkspace);
  }
}
