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
import com.habitparty.application.ports.projections.DashboardTaskDTO;
import com.habitparty.adapters.in.web.dtos.response.TaskResponseDTO;
import com.habitparty.infrastructure.security.AuthenticatedUser;
import com.habitparty.application.usecases.task.ChangeTaskStatusUseCase;
import com.habitparty.application.usecases.task.CreateTaskCommand;
import com.habitparty.application.usecases.task.CreateTaskUseCase;
import com.habitparty.application.usecases.task.DeleteTaskUseCase;
import com.habitparty.application.usecases.task.ListDashboardTasksUseCase;
import com.habitparty.application.usecases.task.ListTasksByColumnUseCase;
import com.habitparty.application.usecases.task.MoveTaskCommand;
import com.habitparty.application.usecases.task.MoveTaskUseCase;
import com.habitparty.application.usecases.task.UpdateTaskCommand;
import com.habitparty.application.usecases.task.RecordHabitScoreUseCase;
import com.habitparty.application.usecases.task.UpdateTaskUseCase;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.domain.enums.task.TaskStatus;

@RestController
public class TaskController implements TaskApi {
  private final CreateTaskUseCase createTaskUseCase;
  private final UpdateTaskUseCase updateTaskUseCase;
  private final DeleteTaskUseCase deleteTaskUseCase;
  private final MoveTaskUseCase moveTaskUseCase;
  private final ChangeTaskStatusUseCase changeTaskStatusUseCase;
  private final RecordHabitScoreUseCase recordHabitScoreUseCase;
  private final ListTasksByColumnUseCase listTasksByColumnUseCase;
  private final ListDashboardTasksUseCase listDashboardTasksUseCase;

  public TaskController(
      CreateTaskUseCase createTaskUseCase,
      UpdateTaskUseCase updateTaskUseCase,
      DeleteTaskUseCase deleteTaskUseCase,
      MoveTaskUseCase moveTaskUseCase,
      ChangeTaskStatusUseCase changeTaskStatusUseCase,
      RecordHabitScoreUseCase recordHabitScoreUseCase,
      ListTasksByColumnUseCase listTasksByColumnUseCase,
      ListDashboardTasksUseCase listDashboardTasksUseCase) {
    this.createTaskUseCase = createTaskUseCase;
    this.updateTaskUseCase = updateTaskUseCase;
    this.deleteTaskUseCase = deleteTaskUseCase;
    this.moveTaskUseCase = moveTaskUseCase;
    this.changeTaskStatusUseCase = changeTaskStatusUseCase;
    this.recordHabitScoreUseCase = recordHabitScoreUseCase;
    this.listTasksByColumnUseCase = listTasksByColumnUseCase;
    this.listDashboardTasksUseCase = listDashboardTasksUseCase;
  }

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
    var command = new CreateTaskCommand(
        dto.name(), dto.description(), dto.priority(), dto.tags(),
        dto.difficulty(), dto.taskType(), dto.isHardcoreModeEnabled(),
        dto.dueDate(), dto.habitType(), dto.resetCounter(), dto.importanceType(),
        dto.startDate(), dto.repeatType(), dto.repeatEvery(), dto.daysOfWeek(),
        dto.monthlyOption(), dto.reminderType(), dto.customReminderAt(),
        dto.sendEmailReminder()
    );
    Task createdTask = createTaskUseCase.execute(userId, boardColumnId, command);
    return ResponseEntity.status(HttpStatus.CREATED).body(TaskResponseDTO.fromDomain(createdTask));
  }

  @Override
  public ResponseEntity<TaskResponseDTO> updateTask(
      UUID taskId,
      AuthenticatedUser userIdLogado,
      UpdateTaskDTO dto) {
    UUID userId = userIdLogado.id();
    var command = new UpdateTaskCommand(
        dto.name(), dto.description(), dto.priority(), dto.tags(),
        dto.difficulty(), dto.isHardcoreModeEnabled(), dto.dueDate(),
        dto.habitType(), dto.resetCounter(), dto.importanceType(),
        dto.startDate(), dto.repeatType(), dto.repeatEvery(), dto.daysOfWeek(),
        dto.monthlyOption(), dto.reminderType(), dto.customReminderAt(),
        dto.sendEmailReminder()
    );
    Task updatedTask = updateTaskUseCase.execute(taskId, userId, command);
    return ResponseEntity.ok(TaskResponseDTO.fromDomain(updatedTask));
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
    List<MoveTaskCommand> commands = itemsToMove.stream()
        .map(item -> new MoveTaskCommand(item.taskId(), item.boardColumnId(), item.newOrderIndex()))
        .toList();
    moveTaskUseCase.execute(userId, commands);
    return ResponseEntity.noContent().build();
  }

  @Override
  public ResponseEntity<TaskResponseDTO> changeStatus(
      UUID taskId,
      AuthenticatedUser userIdLogado,
      TaskStatus newStatus) {
    UUID userId = userIdLogado.id();
    Task updatedTask = changeTaskStatusUseCase.execute(taskId, userId, newStatus);
    return ResponseEntity.ok(TaskResponseDTO.fromDomain(updatedTask));
  }

  @Override
  public ResponseEntity<TaskResponseDTO> recordHabitScore(
      UUID taskId,
      AuthenticatedUser userIdLogado,
      int delta) {
    UUID userId = userIdLogado.id();
    Task updatedHabit = recordHabitScoreUseCase.execute(taskId, userId, delta);
    return ResponseEntity.ok(TaskResponseDTO.fromDomain(updatedHabit));
  }
}
