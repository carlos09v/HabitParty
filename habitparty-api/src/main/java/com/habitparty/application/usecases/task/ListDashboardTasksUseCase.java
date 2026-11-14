package com.habitparty.application.usecases.task;

import java.time.Clock;
import java.time.LocalDate;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.projections.DashboardTaskDTO;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.WorkspaceRepository;
import com.habitparty.application.usecases.user.UserTimeResolver;
import com.habitparty.core.domain.entities.Workspace;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class ListDashboardTasksUseCase {
  private final WorkspaceRepository workspacePort;
  private final TaskRepository port;
  private final UserTimeResolver userTimeResolver;
  private final Clock clock;

  @Autowired
  public ListDashboardTasksUseCase(
      WorkspaceRepository workspacePort,
      TaskRepository port,
      UserTimeResolver userTimeResolver,
      Clock clock) {
    this.workspacePort = workspacePort;
    this.port = port;
    this.userTimeResolver = userTimeResolver;
    this.clock = clock != null ? clock : Clock.systemDefaultZone();
  }

  public ListDashboardTasksUseCase(WorkspaceRepository workspacePort, TaskRepository port, Clock clock) {
    this(workspacePort, port, null, clock);
  }

  public ListDashboardTasksUseCase(WorkspaceRepository workspacePort, TaskRepository port) {
    this(workspacePort, port, null, Clock.systemDefaultZone());
  }

  @Transactional(readOnly = true)
  public Page<DashboardTaskDTO> execute(UUID workspaceId, UUID userIdLogado, String filter, Pageable pageable) {
    Workspace workspace = workspacePort.findById(workspaceId)
        .orElseThrow(() -> new ResourceNotFoundException("Workspace não encontrado."));
    workspace.validateOwnership(userIdLogado);

    // Captura o dia exato da consulta no fuso horário do usuário
    LocalDate today = userTimeResolver != null
        ? userTimeResolver.resolveDate(userIdLogado)
        : LocalDate.now(clock);

    // 4. Solicita a lista paginada à Porta
    // O Adapter já converterá a Projection nativa do banco para o DashboardTaskDTO
    return port.findDashboardTasks(workspaceId, filter, today, pageable);
  }
}
