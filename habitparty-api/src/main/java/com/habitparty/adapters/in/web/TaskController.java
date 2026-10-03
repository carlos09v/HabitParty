package com.habitparty.adapters.in.web;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.habitparty.adapters.in.web.dtos.request.CreateTaskDTO;
import com.habitparty.adapters.in.web.dtos.request.UpdateTaskDTO;
import com.habitparty.adapters.in.web.dtos.request.UpdateTaskOrderDTO;
import com.habitparty.adapters.in.web.dtos.response.DashboardTaskDTO;
import com.habitparty.adapters.in.web.dtos.response.TaskResponseDTO;
import com.habitparty.adapters.out.persistence.entities.UserJpaEntity;
import com.habitparty.application.usecases.task.ChangeTaskStatusUseCase;
import com.habitparty.application.usecases.task.CreateTaskUseCase;
import com.habitparty.application.usecases.task.DeleteTaskUseCase;
import com.habitparty.application.usecases.task.ListDashboardTasksUseCase;
import com.habitparty.application.usecases.task.ListTasksByColumnUseCase;
import com.habitparty.application.usecases.task.MoveTaskUseCase;
import com.habitparty.application.usecases.task.UpdateTaskUseCase;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.domain.enums.task.TaskStatus;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/tasks")
public class TaskController {
  private final CreateTaskUseCase createTaskUseCase;
  private final UpdateTaskUseCase updateTaskUseCase;
  private final DeleteTaskUseCase deleteTaskUseCase;
  private final MoveTaskUseCase moveTaskUseCase;
  private final ChangeTaskStatusUseCase changeTaskStatusUseCase;
  private final ListTasksByColumnUseCase listTasksByColumnUseCase;
  private final ListDashboardTasksUseCase listDashboardTasksUseCase;

  public TaskController(CreateTaskUseCase createTaskUseCase, UpdateTaskUseCase updateTaskUseCase,
      DeleteTaskUseCase deleteTaskUseCase, MoveTaskUseCase moveTaskUseCase,
      ChangeTaskStatusUseCase changeTaskStatusUseCase, ListTasksByColumnUseCase listTasksByColumnUseCase, ListDashboardTasksUseCase listDashboardTasksUseCase) {
    this.createTaskUseCase = createTaskUseCase;
    this.updateTaskUseCase = updateTaskUseCase;
    this.deleteTaskUseCase = deleteTaskUseCase;
    this.moveTaskUseCase = moveTaskUseCase;
    this.changeTaskStatusUseCase = changeTaskStatusUseCase;
    this.listTasksByColumnUseCase = listTasksByColumnUseCase;
    this.listDashboardTasksUseCase = listDashboardTasksUseCase;
  }

  @GetMapping("/column/{boardColumnId}")
  public ResponseEntity<List<TaskResponseDTO>> getTaskListByColumnId(
      @AuthenticationPrincipal UserJpaEntity userIdLogado,
      @PathVariable UUID boardColumnId) {
    UUID userId = userIdLogado.getId();

    List<Task> tasks = listTasksByColumnUseCase.execute(boardColumnId, userId);
    List<TaskResponseDTO> responseList = tasks.stream()
        .map(TaskResponseDTO::fromDomain)
        .toList();

    return ResponseEntity.ok(responseList);
  }

  @GetMapping("/workspace/{workspaceId}/dashboard")
  public ResponseEntity<Page<DashboardTaskDTO>> getDashboardTasks(
      @PathVariable UUID workspaceId,
      @RequestParam(defaultValue = "TODAY") String filter,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size,
      @AuthenticationPrincipal UserJpaEntity usuarioLogado) {
    UUID userId = usuarioLogado.getId();
    // Cria a paginação do Spring (Página zero, X itens, ordenado pelo padrão da query)
    Pageable pageable = PageRequest.of(page, size);

    // Passamos a solicitação para o UseCase (que você vai criar)
    Page<DashboardTaskDTO> responsePage = listDashboardTasksUseCase.execute(
        workspaceId,
        userId,
        filter,
        pageable);

    return ResponseEntity.ok(responsePage);
  }

  @PostMapping("/column/{boardColumnId}")
  public ResponseEntity<TaskResponseDTO> createTask(
      @AuthenticationPrincipal UserJpaEntity userIdLogado,
      @RequestBody @Valid CreateTaskDTO dto,
      @PathVariable UUID boardColumnId) {
    UUID userId = userIdLogado.getId();

    TaskResponseDTO response = createTaskUseCase.execute(userId, boardColumnId, dto);

    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @PutMapping("/{taskId}")
  public ResponseEntity<TaskResponseDTO> updateTask(
      @PathVariable UUID taskId,
      @AuthenticationPrincipal UserJpaEntity userIdLogado,
      @RequestBody @Valid UpdateTaskDTO dto) {
    UUID userId = userIdLogado.getId();

    TaskResponseDTO response = updateTaskUseCase.execute(taskId, userId, dto);

    return ResponseEntity.ok(response);
  }

  @DeleteMapping("/{taskId}")
  public ResponseEntity<Void> deleteTask(
      @PathVariable UUID taskId,
      @AuthenticationPrincipal UserJpaEntity userIdLogado) {
    UUID userId = userIdLogado.getId();

    deleteTaskUseCase.execute(taskId, userId);
    return ResponseEntity.noContent().build(); // 204 No Content (Padrão para deleção)
  }

  // Endpoint em LOTE para o Drag-and-Drop do frontend!
  @PutMapping("/move")
  public ResponseEntity<Void> moveTasks(
      @AuthenticationPrincipal UserJpaEntity userIdLogado,
      @RequestBody List<UpdateTaskOrderDTO> itemsToMove) {
    UUID userId = userIdLogado.getId();

    moveTaskUseCase.execute(userId, itemsToMove);
    return ResponseEntity.noContent().build();
  }

  // Endpoint específico para dar o "Check" e ganhar XP e Moedas (Evento de Negócio)
  @PatchMapping("/{taskId}/status")
  public ResponseEntity<TaskResponseDTO> changeStatus(
      @PathVariable UUID taskId,
      @AuthenticationPrincipal UserJpaEntity userIdLogado,
      @RequestParam TaskStatus newStatus) { // O front envia via Query Param (ex: ?newStatus=COMPLETED)
    UUID userId = userIdLogado.getId();

    TaskResponseDTO response = changeTaskStatusUseCase.execute(taskId, userId, newStatus);
    return ResponseEntity.ok(response);
  }
}
