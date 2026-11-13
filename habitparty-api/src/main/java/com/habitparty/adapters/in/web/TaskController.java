package com.habitparty.adapters.in.web;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
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
import com.habitparty.application.ports.projections.TaskSearchWorkspaceCountDTO;
import com.habitparty.adapters.in.web.dtos.response.TaskHistoryStatusResponseDTO;
import com.habitparty.adapters.in.web.dtos.response.TaskResponseDTO;
import com.habitparty.infrastructure.security.AuthenticatedUser;
import com.habitparty.application.usecases.task.ChangeTaskStatusUseCase;
import com.habitparty.application.usecases.task.CheckTaskHasHistoryUseCase;
import com.habitparty.application.usecases.task.CreateTaskCommand;
import com.habitparty.application.usecases.task.CreateTaskUseCase;
import com.habitparty.application.usecases.task.DeleteTaskUseCase;
import com.habitparty.application.usecases.task.ListDashboardTasksUseCase;
import com.habitparty.application.usecases.task.ListTasksByColumnUseCase;
import com.habitparty.application.usecases.task.MoveTaskCommand;
import com.habitparty.application.usecases.task.MoveTaskUseCase;
import com.habitparty.application.usecases.task.UpdateTaskCommand;
import com.habitparty.application.usecases.task.RecordHabitScoreUseCase;
import com.habitparty.application.usecases.task.SearchTasksAcrossWorkspacesUseCase;
import com.habitparty.application.usecases.task.UpdateTaskUseCase;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.domain.enums.task.TaskStatus;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@RestController
public class TaskController implements TaskApi {
  private final CreateTaskUseCase createTaskUseCase;
  private final UpdateTaskUseCase updateTaskUseCase;
  private final DeleteTaskUseCase deleteTaskUseCase;
  private final CheckTaskHasHistoryUseCase checkTaskHasHistoryUseCase;
  private final MoveTaskUseCase moveTaskUseCase;
  private final ChangeTaskStatusUseCase changeTaskStatusUseCase;
  private final RecordHabitScoreUseCase recordHabitScoreUseCase;
  private final ListTasksByColumnUseCase listTasksByColumnUseCase;
  private final ListDashboardTasksUseCase listDashboardTasksUseCase;
  private final SearchTasksAcrossWorkspacesUseCase searchTasksAcrossWorkspacesUseCase;
  private final Clock clock;

  private LocalDate today() {
    return LocalDate.now(clock);
  }

  private TaskResponseDTO toDto(Task task) {
    return TaskResponseDTO.fromDomain(task, today(), clock.getZone());
  }

  @Override
  public ResponseEntity<List<TaskSearchWorkspaceCountDTO>> searchTasksAcrossWorkspaces(
      String query,
      AuthenticatedUser usuarioLogado) {
    return ResponseEntity.ok(searchTasksAcrossWorkspacesUseCase.execute(usuarioLogado.id(), query));
  }

  @Override
  public ResponseEntity<List<TaskResponseDTO>> getTaskListByColumnId(
      AuthenticatedUser userIdLogado,
      UUID boardColumnId) {
    UUID userId = userIdLogado.id();

    List<Task> tasks = listTasksByColumnUseCase.execute(boardColumnId, userId);
    LocalDate referenceDate = today();
    List<TaskResponseDTO> responseList = tasks.stream()
        .map(t -> TaskResponseDTO.fromDomain(t, referenceDate, clock.getZone()))
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
    int safePage = Math.max(page, 0);
    int safeSize = Math.min(Math.max(size, 1), 100);
    Pageable pageable = PageRequest.of(safePage, safeSize);

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
        dto.sendEmailReminder(), dto.dueTime(), dto.startTime(), dto.dueEndTime(), dto.isAllDay()
    );
    Task createdTask = createTaskUseCase.execute(userId, boardColumnId, command);
    return ResponseEntity.status(HttpStatus.CREATED).body(toDto(createdTask));
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
        dto.sendEmailReminder(), dto.dueTime(), dto.startTime(), dto.dueEndTime(), dto.isAllDay()
    );
    Task updatedTask = updateTaskUseCase.execute(taskId, userId, command);
    return ResponseEntity.ok(toDto(updatedTask));
  }

  @Override
  public ResponseEntity<TaskHistoryStatusResponseDTO> checkTaskHasHistory(
      UUID taskId,
      AuthenticatedUser userIdLogado) {
    UUID userId = userIdLogado.id();
    boolean hasHistory = checkTaskHasHistoryUseCase.execute(taskId, userId);
    return ResponseEntity.ok(new TaskHistoryStatusResponseDTO(hasHistory));
  }

  @Override
  public ResponseEntity<Void> deleteTask(
      UUID taskId,
      boolean deleteHistory,
      AuthenticatedUser userIdLogado) {
    UUID userId = userIdLogado.id();

    deleteTaskUseCase.execute(taskId, userId, deleteHistory);
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
    return ResponseEntity.ok(toDto(updatedTask));
  }

  @Override
  public ResponseEntity<TaskResponseDTO> recordHabitScore(
      UUID taskId,
      AuthenticatedUser userIdLogado,
      int delta) {
    UUID userId = userIdLogado.id();
    Task updatedHabit = recordHabitScoreUseCase.execute(taskId, userId, delta);
    return ResponseEntity.ok(toDto(updatedHabit));
  }
}
