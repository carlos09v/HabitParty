package com.habitparty.application.usecases.task;

import java.time.Clock;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.FocusRecordRepository;
import com.habitparty.application.ports.ProfileHighlightRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.usecases.focus.FocusRecordReversalSupport;
import com.habitparty.application.usecases.workspace.WorkspaceWriteGuard;
import com.habitparty.core.domain.entities.focus.FocusRecord;
import com.habitparty.core.domain.entities.task.Daily;
import com.habitparty.core.domain.entities.task.Habit;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.domain.enums.HighlightType;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
@Transactional
public class DeleteTaskUseCase {
  private final TaskRepository taskPort;
  private final TransactionHistoryRepository transactionPort;
  private FocusRecordRepository focusRecordPort;
  private WorkspaceWriteGuard workspaceWriteGuard;
  private UserRepository userPort;
  private ProfileHighlightRepository profileHighlightPort;
  private Clock clock = Clock.systemUTC();

  public DeleteTaskUseCase(TaskRepository taskPort, TransactionHistoryRepository transactionPort) {
    this.taskPort = taskPort;
    this.transactionPort = transactionPort;
  }

  @Autowired(required = false)
  public void setFocusRecordPort(FocusRecordRepository focusRecordPort) {
    this.focusRecordPort = focusRecordPort;
  }

  @Autowired
  public void setWorkspaceWriteGuard(WorkspaceWriteGuard workspaceWriteGuard) {
    this.workspaceWriteGuard = workspaceWriteGuard;
  }

  @Autowired(required = false)
  public void setUserPort(UserRepository userPort) {
    this.userPort = userPort;
  }

  @Autowired(required = false)
  public void setProfileHighlightPort(ProfileHighlightRepository profileHighlightPort) {
    this.profileHighlightPort = profileHighlightPort;
  }

  @Autowired(required = false)
  public void setClock(Clock clock) {
    this.clock = clock != null ? clock : Clock.systemUTC();
  }

  public void execute(UUID taskId, UUID userIdLogado) {
    execute(taskId, userIdLogado, false);
  }

  /**
   * @param deleteHistory quando verdadeiro, remove também os registros do Histórico vinculados à tarefa
   *                      (conclusões, falhas e penalidades).
   */
  public void execute(UUID taskId, UUID userIdLogado, boolean deleteHistory) {
    Task task = taskPort.findById(taskId)
        .orElseThrow(() -> new ResourceNotFoundException("Tarefa não encontrada."));
    task.validateOwnership(userIdLogado);
    if (workspaceWriteGuard != null) {
      workspaceWriteGuard.assertColumnWritable(
          task.getBoardColumnId(),
          userIdLogado,
          "Este ambiente está em modo somente-leitura no plano Free (máximo de 2 ambientes ativos). Faça upgrade para Premium para excluir tarefas nele!");
    }

    if (focusRecordPort != null) {
      if (deleteHistory) {
        List<FocusRecord> linkedRecords = focusRecordPort.findAllByTaskId(taskId);
        List<FocusRecord> standaloneTaskRecords = linkedRecords.stream()
            .filter(r -> r.getFocusActivityId().isEmpty())
            .toList();
        if (!standaloneTaskRecords.isEmpty()) {
          FocusRecordReversalSupport.revertDeletedRecords(
              userIdLogado,
              standaloneTaskRecords,
              focusRecordPort,
              userPort,
              null,
              null,
              transactionPort,
              clock);
          List<UUID> standaloneTaskRecordIds = standaloneTaskRecords.stream()
              .map(FocusRecord::getId)
              .toList();
          transactionPort.deleteAllByReferenceIdsAndUserId(standaloneTaskRecordIds, userIdLogado);
          focusRecordPort.deleteAllByIds(standaloneTaskRecordIds);
        }
        focusRecordPort.nullifyTaskId(taskId);
      } else {
        focusRecordPort.nullifyTaskId(taskId);
      }
    }

    if (deleteHistory) {
      transactionPort.deleteAllByReferenceIdAndUserId(taskId, userIdLogado);
    }

    if (profileHighlightPort != null && (task instanceof Daily || task instanceof Habit)) {
      profileHighlightPort.deleteByUserIdAndHighlightTypeAndHighlightKey(
          userIdLogado,
          HighlightType.TASK_STREAK,
          taskId.toString());
    }

    taskPort.deleteById(taskId);
  }
}
