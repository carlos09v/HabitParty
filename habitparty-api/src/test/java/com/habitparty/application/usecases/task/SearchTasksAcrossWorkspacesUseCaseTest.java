package com.habitparty.application.usecases.task;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.projections.TaskSearchWorkspaceCountDTO;
import com.habitparty.core.exceptions.DomainValidationException;

@ExtendWith(MockitoExtension.class)
class SearchTasksAcrossWorkspacesUseCaseTest {

  @Mock
  private TaskRepository taskRepository;

  @InjectMocks
  private SearchTasksAcrossWorkspacesUseCase useCase;

  @Test
  @DisplayName("Deve retornar a contagem por workspace com o termo normalizado (trim)")
  void shouldReturnCountsPerWorkspace() {
    UUID userId = UUID.randomUUID();
    var expected = List.of(new TaskSearchWorkspaceCountDTO(UUID.randomUUID(), "Trabalho", 2));
    when(taskRepository.countMatchingTasksByWorkspace(userId, "relatório")).thenReturn(expected);

    var result = useCase.execute(userId, "  relatório  ");

    assertEquals(expected, result);
  }

  @Test
  @DisplayName("Deve rejeitar termos curtos demais, vazios ou longos demais")
  void shouldRejectInvalidQueries() {
    UUID userId = UUID.randomUUID();
    assertThrows(DomainValidationException.class, () -> useCase.execute(userId, null));
    assertThrows(DomainValidationException.class, () -> useCase.execute(userId, " a "));
    assertThrows(DomainValidationException.class, () -> useCase.execute(userId, "x".repeat(101)));
    verify(taskRepository, never()).countMatchingTasksByWorkspace(any(), any());
  }
}
