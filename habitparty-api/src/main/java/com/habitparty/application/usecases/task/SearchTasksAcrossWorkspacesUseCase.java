package com.habitparty.application.usecases.task;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.projections.TaskSearchWorkspaceCountDTO;
import com.habitparty.core.exceptions.DomainValidationException;

/**
 * Busca tarefas do usuário em todos os seus workspaces e retorna a contagem de resultados por workspace.
 * Usado pelo front para sugerir a troca de Ambiente quando a tarefa não é encontrada no workspace atual.
 */
@Service
public class SearchTasksAcrossWorkspacesUseCase {
  public static final int MIN_QUERY_LENGTH = 2;
  public static final int MAX_QUERY_LENGTH = 100;

  private final TaskRepository taskRepository;

  public SearchTasksAcrossWorkspacesUseCase(TaskRepository taskRepository) {
    this.taskRepository = taskRepository;
  }

  @Transactional(readOnly = true)
  public List<TaskSearchWorkspaceCountDTO> execute(UUID userId, String query) {
    String normalized = query == null ? "" : query.trim();
    if (normalized.length() < MIN_QUERY_LENGTH || normalized.length() > MAX_QUERY_LENGTH) {
      throw new DomainValidationException(
          "O termo de busca deve ter entre " + MIN_QUERY_LENGTH + " e " + MAX_QUERY_LENGTH + " caracteres.");
    }
    return taskRepository.countMatchingTasksByWorkspace(userId, normalized);
  }
}
