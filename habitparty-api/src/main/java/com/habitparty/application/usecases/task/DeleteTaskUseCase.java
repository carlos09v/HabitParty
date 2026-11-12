package com.habitparty.application.usecases.task;

import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.stereotype.Service;

import com.habitparty.application.ports.FocusRecordRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.core.domain.entities.focus.FocusRecord;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
@Transactional
public class DeleteTaskUseCase {
  private final TaskRepository taskPort;
  private final TransactionHistoryRepository transactionPort;
  private FocusRecordRepository focusRecordPort;

  public DeleteTaskUseCase(TaskRepository taskPort, TransactionHistoryRepository transactionPort) {
    this.taskPort = taskPort;
    this.transactionPort = transactionPort;
  }

  @Autowired(required = false)
  public void setFocusRecordPort(FocusRecordRepository focusRecordPort) {
    this.focusRecordPort = focusRecordPort;
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

    if (focusRecordPort != null) {
      if (deleteHistory) {
        List<FocusRecord> linkedRecords = focusRecordPort.findAllByTaskId(taskId);
        List<UUID> standaloneTaskRecordIds = linkedRecords.stream()
            .filter(r -> r.getFocusActivityId().isEmpty())
            .map(FocusRecord::getId)
            .toList();
        if (!standaloneTaskRecordIds.isEmpty()) {
          transactionPort.deleteAllByReferenceIdsAndUserId(standaloneTaskRecordIds, userIdLogado);
          standaloneTaskRecordIds.forEach(focusRecordPort::deleteById);
        }
        focusRecordPort.nullifyTaskId(taskId);
      } else {
        focusRecordPort.nullifyTaskId(taskId);
      }
    }

    if (deleteHistory) {
      transactionPort.deleteAllByReferenceIdAndUserId(taskId, userIdLogado);
    }

    taskPort.deleteById(taskId);
  }
}
