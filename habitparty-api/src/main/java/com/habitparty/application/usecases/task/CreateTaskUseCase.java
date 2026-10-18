package com.habitparty.application.usecases.task;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.BoardColumnRepository;
import com.habitparty.application.ports.EmailDispatchLogRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.ports.WorkspaceRepository;
import com.habitparty.core.domain.entities.BoardColumn;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.Workspace;
import com.habitparty.core.domain.entities.task.ChecklistItem;
import com.habitparty.core.domain.entities.task.Daily;
import com.habitparty.core.domain.entities.task.Habit;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.domain.entities.task.Todo;
import com.habitparty.core.domain.enums.task.TaskDifficulty;
import com.habitparty.core.domain.enums.task.TaskStatus;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.LimitExceededException;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
@Transactional
public class CreateTaskUseCase {
  private final TaskRepository taskPort;
  private final BoardColumnRepository boardColumnPort;
  private final UserRepository userPort;
  private final EmailDispatchLogRepository emailLogPort;
  private final WorkspaceRepository workspacePort;

  public CreateTaskUseCase(
      TaskRepository taskPort,
      BoardColumnRepository boardColumnPort,
      UserRepository userPort,
      EmailDispatchLogRepository emailLogPort,
      WorkspaceRepository workspacePort) {
    this.taskPort = taskPort;
    this.boardColumnPort = boardColumnPort;
    this.userPort = userPort;
    this.emailLogPort = emailLogPort;
    this.workspacePort = workspacePort;
  }

  public Task execute(UUID userIdLogado, UUID boardColumnId, CreateTaskCommand command) {
    BoardColumn column = boardColumnPort.findById(boardColumnId)
        .orElseThrow(() -> new ResourceNotFoundException("Coluna não encontrada."));
    column.validateOwnership(userIdLogado);

    User user = userPort.findById(userIdLogado)
        .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

    // Validação de Modo Somente-Leitura em Ambientes excedentes no plano Free (máx. 2 ambientes ativos)
    if (!user.isPremium()) {
      List<Workspace> userWorkspaces = workspacePort.findAllByUserId(userIdLogado);
      int wsIndex = -1;
      for (int i = 0; i < userWorkspaces.size(); i++) {
        if (userWorkspaces.get(i).getId().equals(column.getWorkspaceId())) {
          wsIndex = i;
          break;
        }
      }
      if (wsIndex >= 2) {
        throw new LimitExceededException(
            "Este ambiente está em modo somente-leitura no plano Free (máximo de 2 ambientes ativos). Faça upgrade para Premium para criar tarefas nele!"
        );
      }
    }

    int maxIndex = taskPort.findMaxOrderIndexByBoardColumnId(boardColumnId);
    int newOrderIndex = maxIndex + 1;

    UUID newTaskId = UUID.randomUUID();
    LocalDateTime now = LocalDateTime.now();
    List<ChecklistItem> emptyChecklist = List.of();

    Task newTask;

    switch (command.taskType()) {
      case HABIT -> {
        newTask = new Habit(
            newTaskId, boardColumnId, userIdLogado, command.name(), command.description(),
            newOrderIndex, command.priority(), command.tags(), TaskDifficulty.EASY, TaskStatus.PENDING,
            command.taskType(), command.isHardcoreModeEnabled(), command.dueDate(), now, emptyChecklist,
            0, command.habitType(), command.resetCounter(), command.importanceType(), null
        );
      }
      case DAILY -> {
        int safeRepeat = (command.repeatEvery() != null) ? command.repeatEvery() : 1;

        newTask = new Daily(
            newTaskId, boardColumnId, userIdLogado, command.name(), command.description(),
            newOrderIndex, command.priority(), command.tags(), command.difficulty(), TaskStatus.PENDING,
            command.taskType(), command.isHardcoreModeEnabled(), command.dueDate(), now, emptyChecklist,
            0, command.startDate(), command.repeatType(), safeRepeat, command.daysOfWeek(), command.monthlyOption(), null
        );
      }
      case TODO -> {
        if (command.isHardcoreModeEnabled() && command.dueDate() != null && command.dueDate().isBefore(java.time.LocalDate.now())) {
          throw new DomainValidationException("A data de vencimento de um afazer no modo Hardcore não pode ser no passado.");
        }

        LocalDateTime calculatedReminderAt = Todo.calculateReminderTime(
            command.dueDate(), 
            command.reminderType(), 
            command.customReminderAt()
        );

        boolean sendEmail = Boolean.TRUE.equals(command.sendEmailReminder());
        if (sendEmail) {
          boolean isPremium = user.isPremium();
          int maxActive = com.habitparty.core.domain.entities.task.EmailReminderQuotas.getMaxActiveReminders(isPremium);
          int maxMonthly = com.habitparty.core.domain.entities.task.EmailReminderQuotas.getMaxMonthlyDispatches(isPremium);

          long activeReminders = taskPort.countActiveEmailRemindersByUserId(userIdLogado);
          if (activeReminders >= maxActive) {
            String msg = isPremium
                ? "Limite de lembretes ativos atingido! Usuários Premium podem ter no máximo " + maxActive + " lembretes por e-mail ativos simultaneamente (Política de Uso Justo)."
                : "Limite de lembretes atingido! Usuários do plano gratuito podem ter no máximo " + maxActive + " lembretes por e-mail ativos simultaneamente. Assine o plano Premium para ter até 30 lembretes ativos.";
            throw new DomainValidationException(msg);
          }

          LocalDateTime startOfMonth = java.time.LocalDate.now().withDayOfMonth(1).atStartOfDay();
          long sentThisMonth = emailLogPort.countByUserIdAndEmailTypeAndStatusAndSentAtAfter(
              userIdLogado,
              com.habitparty.core.domain.enums.EmailType.TASK_REMINDER,
              com.habitparty.core.domain.enums.EmailDispatchStatus.SENT,
              startOfMonth
          );
          if (sentThisMonth >= maxMonthly) {
            String msg = isPremium
                ? "Cota mensal atingida! Usuários Premium podem receber no máximo " + maxMonthly + " lembretes por e-mail por mês (Política de Uso Justo)."
                : "Limite mensal atingido! Usuários do plano gratuito podem receber no máximo " + maxMonthly + " lembretes por e-mail por mês. Faça upgrade para o plano Premium para ter até 100 disparos mensais.";
            throw new DomainValidationException(msg);
          }
        }

        newTask = new Todo(
            newTaskId, boardColumnId, userIdLogado, command.name(), command.description(),
            newOrderIndex, command.priority(), command.tags(), command.difficulty(), TaskStatus.PENDING,
            command.taskType(), command.isHardcoreModeEnabled(), command.dueDate(), now, emptyChecklist,
            command.reminderType(), calculatedReminderAt, null, false, sendEmail, false
        );
      }
      default -> throw new DomainValidationException("Tipo de tarefa inválido: " + command.taskType());
    }

    return taskPort.save(newTask);
  }
}
