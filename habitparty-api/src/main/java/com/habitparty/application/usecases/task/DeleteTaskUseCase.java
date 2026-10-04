package com.habitparty.application.usecases.task;

import java.util.UUID;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.stereotype.Service;

import com.habitparty.application.ports.TaskRepository;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
@Transactional
public class DeleteTaskUseCase {
  private final TaskRepository taskPort;

  public DeleteTaskUseCase(TaskRepository taskPort) {
    this.taskPort = taskPort;
  }

  public void execute(UUID taskId, UUID userIdLogado) {
    Task task = taskPort.findById(taskId)
        .orElseThrow(() -> new ResourceNotFoundException("Tarefa não encontrada."));
    task.validateOwnership(userIdLogado);

    taskPort.deleteById(taskId);
  }
}
