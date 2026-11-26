package com.habitparty.application.usecases.workspace;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.ports.WorkspaceRepository;
import com.habitparty.core.domain.entities.Workspace;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
@Transactional(readOnly = true)
public class ListUserWorkspacesUseCase {
  private final WorkspaceRepository workspacePort;
  private final UserRepository userPort;

  public ListUserWorkspacesUseCase(WorkspaceRepository workspacePort, UserRepository userPort) {
    this.workspacePort = workspacePort;
    this.userPort = userPort;
  }

  public List<Workspace> execute(UUID userIdLogado) {
    // 1. Reutiliza a porta do Usuário para checar se ele existe!
    userPort.findById(userIdLogado)
      .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado!")); 
    
    return workspacePort.findAllByUserId(userIdLogado);
  }
}
