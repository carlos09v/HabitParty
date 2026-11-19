package com.habitparty.application.usecases.task;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.ports.WorkspaceRepository;
import com.habitparty.application.ports.projections.FocusableTaskDTO;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.Workspace;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserRole;

@ExtendWith(MockitoExtension.class)
class ListFocusableTasksUseCaseTest {

  @Mock
  private UserRepository userRepository;

  @Mock
  private WorkspaceRepository workspaceRepository;

  @Mock
  private TaskRepository taskRepository;

  private User createUser(UUID id, boolean isPremium) {
    return new User(
        id, UserRole.USER, isPremium, "User", "user", "user@hp.com", "pwd",
        BigDecimal.ZERO, BigDecimal.ZERO, LocalDate.of(1995, 1, 1), null,
        UserGender.PREFER_NOT_TO_SAY, 0, 0, 0, LocalDateTime.now());
  }

  @Test
  @DisplayName("Plano Free deve consultar tarefas focáveis apenas dos 2 primeiros workspaces ativos")
  void shouldLimitWorkspacesForFreeUsers() {
    UUID userId = UUID.randomUUID();
    UUID ws1 = UUID.randomUUID();
    UUID ws2 = UUID.randomUUID();
    UUID ws3 = UUID.randomUUID();

    when(userRepository.findById(userId)).thenReturn(Optional.of(createUser(userId, false)));
    when(workspaceRepository.findAllByUserId(userId)).thenReturn(List.of(
        new Workspace(ws1, userId, "W1"),
        new Workspace(ws2, userId, "W2"),
        new Workspace(ws3, userId, "W3")
    ));
    List<FocusableTaskDTO> expected = List.of(
        new FocusableTaskDTO(UUID.randomUUID(), "Estudar", "daily", "Hoje", "W1", 25, 1, false)
    );
    when(taskRepository.findFocusableTasksByWorkspaceIds(userId, List.of(ws1, ws2))).thenReturn(expected);

    ListFocusableTasksUseCase useCase = new ListFocusableTasksUseCase(userRepository, workspaceRepository, taskRepository);
    var actual = useCase.execute(userId);

    assertEquals(expected, actual);
    verify(taskRepository).findFocusableTasksByWorkspaceIds(userId, List.of(ws1, ws2));
  }

  @Test
  @DisplayName("Plano Premium deve incluir todos os workspaces e retornar vazio sem consultar tasks se não houver workspaces")
  void shouldIncludeAllWorkspacesForPremiumAndReturnEmptyWhenNoneExist() {
    UUID userId = UUID.randomUUID();
    UUID ws1 = UUID.randomUUID();
    UUID ws2 = UUID.randomUUID();
    UUID ws3 = UUID.randomUUID();

    when(userRepository.findById(userId)).thenReturn(Optional.of(createUser(userId, true)));
    when(workspaceRepository.findAllByUserId(userId)).thenReturn(List.of(
        new Workspace(ws1, userId, "W1"),
        new Workspace(ws2, userId, "W2"),
        new Workspace(ws3, userId, "W3")
    ));

    ListFocusableTasksUseCase useCase = new ListFocusableTasksUseCase(userRepository, workspaceRepository, taskRepository);
    useCase.execute(userId);
    verify(taskRepository).findFocusableTasksByWorkspaceIds(userId, List.of(ws1, ws2, ws3));

    UUID userWithoutWs = UUID.randomUUID();
    when(userRepository.findById(userWithoutWs)).thenReturn(Optional.of(createUser(userWithoutWs, false)));
    when(workspaceRepository.findAllByUserId(userWithoutWs)).thenReturn(List.of());
    assertTrue(useCase.execute(userWithoutWs).isEmpty());
    verifyNoMoreInteractions(taskRepository);
  }
}
