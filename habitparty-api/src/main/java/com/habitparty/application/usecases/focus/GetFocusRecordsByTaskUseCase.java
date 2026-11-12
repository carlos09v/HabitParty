package com.habitparty.application.usecases.focus;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

import com.habitparty.application.ports.FocusRecordRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.core.domain.entities.focus.FocusRecord;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class GetFocusRecordsByTaskUseCase {
  private final FocusRecordRepository port;
  private final TaskRepository taskPort;

  public GetFocusRecordsByTaskUseCase(FocusRecordRepository port, TaskRepository taskPort) {
    this.port = port;
    this.taskPort = taskPort;
  }

  public Page<FocusRecord> execute(UUID userIdLogado, UUID taskId, int page) {
    Task task = taskPort.findById(taskId)
        .orElseThrow(() -> new ResourceNotFoundException("Tarefa não encontrada."));
    task.validateOwnership(userIdLogado);

    int safePage = Math.max(page, 0);
    return port.findAllByTaskId(taskId, safePage, 20);
  }
}
