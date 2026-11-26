package com.habitparty.application.usecases.task;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.EmailDispatchLogRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.usecases.workspace.WorkspaceWriteGuard;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.task.ChecklistItem;
import com.habitparty.core.domain.entities.task.Daily;
import com.habitparty.core.domain.entities.task.Habit;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.domain.entities.task.Todo;
import com.habitparty.core.domain.enums.EmailDispatchStatus;
import com.habitparty.core.domain.enums.EmailType;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.LimitExceededException;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service 
@Transactional
public class UpdateTaskUseCase {
  private final TaskRepository port;
  private final UserRepository userPort;
  private final EmailDispatchLogRepository emailLogPort;
  private final Clock clock;
  private WorkspaceWriteGuard workspaceWriteGuard;

  @Autowired
  public UpdateTaskUseCase(
      TaskRepository port,
      UserRepository userPort,
      EmailDispatchLogRepository emailLogPort,
      Clock clock) {
    this.port = port;
    this.userPort = userPort;
    this.emailLogPort = emailLogPort;
    this.clock = clock != null ? clock : Clock.systemDefaultZone();
  }

  public UpdateTaskUseCase(
      TaskRepository port,
      UserRepository userPort,
      EmailDispatchLogRepository emailLogPort) {
    this(port, userPort, emailLogPort, Clock.systemDefaultZone());
  }

  @Autowired
  public void setWorkspaceWriteGuard(WorkspaceWriteGuard workspaceWriteGuard) {
    this.workspaceWriteGuard = workspaceWriteGuard;
  }

  public Task execute(UUID taskId, UUID userIdLogado, UpdateTaskCommand command) {
    Task task = port.findById(taskId)
        .orElseThrow(() -> new ResourceNotFoundException("Tarefa não encontrada."));
    task.validateOwnership(userIdLogado);

    User loadedUser = userPort != null ? userPort.findById(userIdLogado).orElse(null) : null;
    if (workspaceWriteGuard != null && loadedUser != null) {
      workspaceWriteGuard.assertColumnWritable(
          loadedUser,
          task.getBoardColumnId(),
          "Este ambiente está em modo somente-leitura no plano Free (máximo de 2 ambientes ativos). Faça upgrade para Premium para editar tarefas nele!");
    }
    ZoneId userZone = loadedUser != null ? loadedUser.resolveZoneId(clock.getZone()) : clock.getZone();
    LocalDate today = loadedUser != null ? loadedUser.resolveLocalDate(clock) : LocalDate.now(clock);

    // Validação específica para Todo no modo Hardcore antes da atualização
    if (task instanceof Todo t) {
      if (command.isHardcoreModeEnabled()) {
        LocalDate effectiveDueDate = command.dueDate() != null ? command.dueDate() : t.getDueDate().orElse(null);
        if (effectiveDueDate == null) {
          throw new DomainValidationException("Afazeres no modo Hardcore exigem uma data de vencimento.");
        }
        if (!t.isHardcoreModeEnabled() && effectiveDueDate.isBefore(today)) {
          throw new DomainValidationException("Não é permitido ativar o modo Hardcore com data no passado.");
        }
      }
    }

    // 2. Atualiza os campos comuns
    task.updateBaseDetails(
        command.name(), command.description(), command.priority(), 
        command.difficulty(), command.tags(), command.isHardcoreModeEnabled(),
        today
    );
    List<ChecklistItem> downgradedChecklistItems = task.clearRewardedChecklistItemsIfNotHard();

    // 3. Atualiza os campos específicos usando Pattern Matching exaustivo (sealed Task)
    switch (task) {
      case Habit h -> h.updateHabitDetails(command.habitType(), command.resetCounter(), command.importanceType());
      case Daily d -> {
        int safeRepeat = command.repeatEvery() != null ? command.repeatEvery() : 1;
        d.updateDailyDetails(command.startDate(), command.repeatType(), safeRepeat,
            command.daysOfWeek(), command.monthlyOption(), today);
      }
      case Todo t -> {
        if (Boolean.TRUE.equals(command.sendEmailReminder())) {
          boolean wasAlreadyActive = t.isSendEmailReminder() && !t.isEmailReminderSent();
          if (!wasAlreadyActive) {
            TodoSchedulePolicy.validateEmailReminderQuotas(
                loadedUser, userIdLogado, today, userZone, port, emailLogPort);
          }
        }

        boolean isEventSchedule = TodoSchedulePolicy.isEventSchedule(
            command.isAllDay(), command.startTime(), command.dueEndTime());
        TodoSchedulePolicy.assertEventScheduleAllowed(loadedUser, isEventSchedule);

        LocalDate effectiveDueDate = TodoSchedulePolicy.resolveEffectiveDueDate(
            command.dueDate(), command.dueTime(), isEventSchedule, today);

        LocalDateTime newReminderAt = Todo.calculateReminderTime(
            effectiveDueDate, command.reminderType(), command.customReminderAt());
        t.updateTodoDetails(
            effectiveDueDate, command.dueTime(), command.reminderType(), newReminderAt, command.sendEmailReminder(), today);
        TodoSchedulePolicy.applyEventSchedule(
            t, command.startTime(), command.dueEndTime(), command.isAllDay(), today, true);
      }
    }

    Task savedTask = port.save(task);
    if (!downgradedChecklistItems.isEmpty()) {
      port.saveChecklistItems(downgradedChecklistItems);
    }
    return savedTask;
  }
}
