package com.habitparty.adapters.in.web;

import java.util.List;
import lombok.RequiredArgsConstructor;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import com.habitparty.adapters.in.web.api.TaskApi;
import com.habitparty.adapters.in.web.dtos.request.CreateTaskDTO;
import com.habitparty.adapters.in.web.dtos.request.UpdateTaskDTO;
import com.habitparty.adapters.in.web.dtos.request.UpdateTaskOrderDTO;
import com.habitparty.adapters.in.web.dtos.response.DashboardTaskDTO;
import com.habitparty.adapters.in.web.dtos.response.TaskResponseDTO;
import com.habitparty.infrastructure.security.AuthenticatedUser;
import com.habitparty.application.usecases.task.ChangeTaskStatusUseCase;
import com.habitparty.application.usecases.task.CreateTaskUseCase;
import com.habitparty.application.usecases.task.DeleteTaskUseCase;
import com.habitparty.application.usecases.task.ListDashboardTasksUseCase;
import com.habitparty.application.usecases.task.ListTasksByColumnUseCase;
import com.habitparty.application.usecases.task.MoveTaskUseCase;
import com.habitparty.application.usecases.task.UpdateTaskUseCase;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.domain.enums.task.TaskStatus;

@RequiredArgsConstructor
@RestController
public class TaskController implements TaskApi {
  private final CreateTaskUseCase createTaskUseCase;
  private final UpdateTaskUseCase updateTaskUseCase;
  private final DeleteTaskUseCase deleteTaskUseCase;
  private final MoveTaskUseCase moveTaskUseCase;
  private final ChangeTaskStatusUseCase changeTaskStatusUseCase;
  private final ListTasksByColumnUseCase listTasksByColumnUseCase;
  private final ListDashboardTasksUseCase listDashboardTasksUseCase;

  @Override
  public ResponseEntity<List<TaskResponseDTO>> getTaskListByColumnId(
      AuthenticatedUser userIdLogado,
      UUID boardColumnId) {
    UUID userId = userIdLogado.id();

    List<Task> tasks = listTasksByColumnUseCase.execute(boardColumnId, userId);
    List<TaskResponseDTO> responseList = tasks.stream()
        .map(TaskResponseDTO::fromDomain)
        .toList();

    return ResponseEntity.ok(responseList);
  }

  @Override
  public ResponseEntity<Page<DashboardTaskDTO>> getDashboardTasks(
      UUID workspaceId,
      String filter,
      int page,
      int size,
      AuthenticatedUser usuarioLogado) {
    UUID userId = usuarioLogado.id();
    Pageable pageable = PageRequest.of(page, size);

    Page<DashboardTaskDTO> responsePage = listDashboardTasksUseCase.execute(
        workspaceId,
        userId,
        filter,
        pageable);

    return ResponseEntity.ok(responsePage);
  }

  @Override
  public ResponseEntity<TaskResponseDTO> createTask(
      AuthenticatedUser userIdLogado,
      CreateTaskDTO dto,
      UUID boardColumnId) {
    UUID userId = userIdLogado.id();

    TaskResponseDTO response = createTaskUseCase.execute(userId, boardColumnId, dto);

    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @Override
  public ResponseEntity<TaskResponseDTO> updateTask(
      UUID taskId,
      AuthenticatedUser userIdLogado,
      UpdateTaskDTO dto) {
    UUID userId = userIdLogado.id();

    TaskResponseDTO response = updateTaskUseCase.execute(taskId, userId, dto);

    return ResponseEntity.ok(response);
  }

  @Override
  public ResponseEntity<Void> deleteTask(
      UUID taskId,
      AuthenticatedUser userIdLogado) {
    UUID userId = userIdLogado.id();

    deleteTaskUseCase.execute(taskId, userId);
    return ResponseEntity.noContent().build();
  }

  @Override
  public ResponseEntity<Void> moveTasks(
      AuthenticatedUser userIdLogado,
      List<UpdateTaskOrderDTO> itemsToMove) {
    UUID userId = userIdLogado.id();

    moveTaskUseCase.execute(userId, itemsToMove);
    return ResponseEntity.noContent().build();
  }

  @Override
  public ResponseEntity<TaskResponseDTO> changeStatus(
      UUID taskId,
      AuthenticatedUser userIdLogado,
      TaskStatus newStatus) {
    UUID userId = userIdLogado.id();

    TaskResponseDTO response = changeTaskStatusUseCase.execute(taskId, userId, newStatus);
    return ResponseEntity.ok(response);
  }
}
