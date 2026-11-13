package com.habitparty.application.usecases.task;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.FocusRecordRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class CheckTaskHasHistoryUseCase {
  private final TaskRepository taskPort;
  private final TransactionHistoryRepository transactionPort;
  private final FocusRecordRepository focusRecordPort;

  public CheckTaskHasHistoryUseCase(
      TaskRepository taskPort,
      TransactionHistoryRepository transactionPort,
      FocusRecordRepository focusRecordPort) {
    this.taskPort = taskPort;
    this.transactionPort = transactionPort;
    this.focusRecordPort = focusRecordPort;
  }

  @Transactional(readOnly = true)
  public boolean execute(UUID taskId, UUID userIdLogado) {
    Task task = taskPort.findById(taskId)
        .orElseThrow(() -> new ResourceNotFoundException("Tarefa não encontrada."));
    task.validateOwnership(userIdLogado);

    if (transactionPort.existsByReferenceIdAndUserId(taskId, userIdLogado)) {
      return true;
    }

    return focusRecordPort != null && focusRecordPort.existsStandaloneByTaskId(taskId);
  }
}
