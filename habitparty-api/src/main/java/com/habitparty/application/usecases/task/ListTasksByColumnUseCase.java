package com.habitparty.application.usecases.task;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.habitparty.application.ports.BoardColumnRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.core.domain.entities.BoardColumn;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class ListTasksByColumnUseCase {
  private final TaskRepository port;
  private final BoardColumnRepository columnRepository;

  public ListTasksByColumnUseCase(TaskRepository port, BoardColumnRepository columnRepository) {
    this.port = port;
    this.columnRepository = columnRepository;
  }

  public List<Task> execute(UUID boardColumnId, UUID userIdLogado) {
    BoardColumn column = columnRepository.findById(boardColumnId)
        .orElseThrow(() -> new ResourceNotFoundException("Coluna não encontrada!"));
    column.validateOwnership(userIdLogado);

    return port.findByBoardColumnIdOrderByOrderIndexAsc(boardColumnId);
  }
}
