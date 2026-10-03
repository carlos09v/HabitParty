package com.habitparty.application.usecases.workspace;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.habitparty.adapters.in.web.dtos.response.BoardColumnResponseDTO;
import com.habitparty.adapters.in.web.dtos.response.TaskResponseDTO;
import com.habitparty.adapters.in.web.dtos.response.WorkspaceResponseDTO;
import com.habitparty.application.ports.BoardColumnRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.WorkspaceRepository;
import com.habitparty.core.domain.entities.BoardColumn;
import com.habitparty.core.domain.entities.Workspace;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class GetFullKanbanBoardUseCase {
  private final WorkspaceRepository port;
  private final BoardColumnRepository columnRepository;
  private final TaskRepository taskRepository;

  public GetFullKanbanBoardUseCase(WorkspaceRepository port, BoardColumnRepository columnRepository,
      TaskRepository taskRepository) {
    this.port = port;
    this.columnRepository = columnRepository;
    this.taskRepository = taskRepository;
  }

  public WorkspaceResponseDTO execute(UUID workspaceId, UUID userIdLogado) {
    Workspace workspace = port.findById(workspaceId)
        .orElseThrow(() -> new ResourceNotFoundException("Workspace não encontrado!"));
    workspace.validateOwnership(userIdLogado);

    // 2. Pega as Colunas Visíveis daquele Workspace
    List<BoardColumn> columns = columnRepository.findVisibleByWorkspaceId(workspaceId);

    // 3. Para cada coluna, busca as Tasks e monta o DTO aninhado
    List<BoardColumnResponseDTO> columnDTOs = columns.stream().map(column -> {

      // Busca as tarefas da coluna X
      List<Task> tasks = taskRepository.findByBoardColumnIdOrderByOrderIndexAsc(column.getId());
      List<TaskResponseDTO> taskDTOs = tasks.stream().map(TaskResponseDTO::fromDomain).toList();

      return BoardColumnResponseDTO.fromDomain(column, taskDTOs);

    }).toList();

    // 4. Monta o grande DTO final para o Front-end
    return new WorkspaceResponseDTO(
        workspace.getId(),
        workspace.getUserId(),
        workspace.getName(),
        columnDTOs // Injeta as colunas já com as tarefas dentro!
    );
  }
}
