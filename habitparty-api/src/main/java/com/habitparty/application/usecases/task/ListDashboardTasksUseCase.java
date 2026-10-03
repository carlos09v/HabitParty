package com.habitparty.application.usecases.task;

import java.time.LocalDate;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.habitparty.adapters.in.web.dtos.response.DashboardTaskDTO;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.WorkspaceRepository;
import com.habitparty.core.domain.entities.Workspace;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class ListDashboardTasksUseCase {
  private final WorkspaceRepository workspacePort;
  private final TaskRepository port;

  public ListDashboardTasksUseCase(WorkspaceRepository workspacePort, TaskRepository port) {
    this.workspacePort = workspacePort;
    this.port = port;
  }

  public Page<DashboardTaskDTO> execute(UUID workspaceId, UUID userIdLogado, String filter, Pageable pageable) {
    Workspace workspace = workspacePort.findById(workspaceId)
        .orElseThrow(() -> new ResourceNotFoundException("Workspace não encontrado."));
    workspace.validateOwnership(userIdLogado);

    // Captura o dia exato da consulta (para cruzar com o status OVERDUE e TODAY)
    LocalDate today = LocalDate.now();

    // 4. Solicita a lista paginada à Porta
    // O Adapter já converterá a Projection nativa do banco para o DashboardTaskDTO
    return port.findDashboardTasks(workspaceId, filter, today, pageable);
  }
}
