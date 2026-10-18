package com.habitparty.application.usecases.task;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
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
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.habitparty.application.ports.EmailDispatchLogRepository;
import com.habitparty.application.ports.EmailSenderPort;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.task.Todo;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserRole;
import com.habitparty.core.domain.enums.task.TaskDifficulty;
import com.habitparty.core.domain.enums.task.TaskPriority;
import com.habitparty.core.domain.enums.task.TaskStatus;
import com.habitparty.core.domain.enums.task.TaskType;
import com.habitparty.core.domain.enums.task.TodoReminderType;

@ExtendWith(MockitoExtension.class)
class SendTaskRemindersUseCaseTest {

  @Mock
  private TaskRepository taskPort;

  @Mock
  private UserRepository userPort;

  @Mock
  private EmailSenderPort emailPort;

  @Mock
  private EmailDispatchLogRepository emailLogPort;

  @InjectMocks
  private SendTaskRemindersUseCase useCase;

  private User createTestUser(UUID userId) {
    return new User(
        userId, UserRole.USER, false, "Carlos Vinicius", "carlosv", "carlos@example.com",
        "hashedpass", BigDecimal.TEN, BigDecimal.TEN, LocalDate.of(1995, 5, 20),
        null, UserGender.MALE, 100, 5, 10, LocalDateTime.now()
    );
  }

  private Todo createTestTodo(UUID userId, boolean sendEmailReminder, boolean emailReminderSent) {
    return new Todo(
        UUID.randomUUID(), UUID.randomUUID(), userId, "Estudar Clean Arch", "Revisar portas",
        0, TaskPriority.HIGH, List.of("estudo"), TaskDifficulty.MEDIUM, TaskStatus.PENDING,
        TaskType.TODO, false, LocalDate.now().plusDays(1), LocalDateTime.now(), List.of(),
        TodoReminderType.ONE_DAY_EARLY, LocalDateTime.now().minusMinutes(5), null, false,
        sendEmailReminder, emailReminderSent
    );
  }

  @Test
  @DisplayName("Deve retornar 0 quando não houver tarefas com lembretes pendentes")
  void shouldReturnZeroWhenNoPendingReminders() {
    when(taskPort.findPendingEmailReminders(any(), any())).thenReturn(List.of());

    int count = useCase.execute();

    assertEquals(0, count);
    verify(emailPort, never()).sendTaskReminderEmail(any(), any(), any(), any(), any(Boolean.class));
  }

  @Test
  @DisplayName("Deve disparar e-mail e marcar lembrete como enviado com sucesso")
  void shouldSendEmailAndMarkAsSent() {
    UUID userId = UUID.randomUUID();
    User user = createTestUser(userId);
    Todo todo = createTestTodo(userId, true, false);

    when(taskPort.findPendingEmailReminders(any(), any())).thenReturn(List.of(todo));
    when(userPort.findById(userId)).thenReturn(Optional.of(user));
    when(emailPort.sendTaskReminderEmail(any(), any(), any(), any(), any(Boolean.class))).thenReturn(true);

    int count = useCase.execute();

    assertEquals(1, count);
    assertTrue(todo.isEmailReminderSent());
    verify(emailPort, times(1)).sendTaskReminderEmail(
        eq("carlos@example.com"),
        eq("Carlos Vinicius"),
        eq("Estudar Clean Arch"),
        eq(todo.getDueDate().orElse(null)),
        eq(false)
    );
    verify(taskPort, times(1)).save(todo);
    verify(emailLogPort, times(1)).save(any());
  }

  @Test
  @DisplayName("Deve pular envio de e-mail e registrar falha quando usuário gratuito exceder cota mensal de 20 envios")
  void shouldSkipWhenFreeUserExceedsMonthlyLimit() {
    UUID userId = UUID.randomUUID();
    User freeUser = createTestUser(userId); // free user
    Todo todo = createTestTodo(userId, true, false);

    when(taskPort.findPendingEmailReminders(any(), any())).thenReturn(List.of(todo));
    when(userPort.findById(userId)).thenReturn(Optional.of(freeUser));
    when(emailLogPort.countByUserIdAndEmailTypeAndStatusAndSentAtAfter(
        eq(userId),
        eq(com.habitparty.core.domain.enums.EmailType.TASK_REMINDER),
        eq(com.habitparty.core.domain.enums.EmailDispatchStatus.SENT),
        any()
    )).thenReturn(20L);

    int count = useCase.execute();

    assertEquals(0, count);
    assertTrue(todo.isEmailReminderSent());
    verify(emailPort, never()).sendTaskReminderEmail(any(), any(), any(), any(), any(Boolean.class));
    verify(taskPort, times(1)).save(todo);
    verify(emailLogPort, times(1)).save(any());
  }

  @Test
  @DisplayName("Deve pular envio de e-mail e registrar falha quando usuário premium exceder cota de uso justo de 100 envios")
  void shouldSkipWhenPremiumUserExceedsFairUseLimit() {
    UUID userId = UUID.randomUUID();
    User premiumUser = new User(
        userId, UserRole.USER, true, "Carlos VIP", "carlosvip", "vip@example.com",
        "hashedpass", BigDecimal.TEN, BigDecimal.TEN, LocalDate.of(1995, 5, 20),
        null, UserGender.MALE, 100, 5, 10, LocalDateTime.now()
    );
    Todo todo = createTestTodo(userId, true, false);

    when(taskPort.findPendingEmailReminders(any(), any())).thenReturn(List.of(todo));
    when(userPort.findById(userId)).thenReturn(Optional.of(premiumUser));
    when(emailLogPort.countByUserIdAndEmailTypeAndStatusAndSentAtAfter(
        eq(userId),
        eq(com.habitparty.core.domain.enums.EmailType.TASK_REMINDER),
        eq(com.habitparty.core.domain.enums.EmailDispatchStatus.SENT),
        any()
    )).thenReturn(100L);

    int count = useCase.execute();

    assertEquals(0, count);
    assertTrue(todo.isEmailReminderSent());
    verify(emailPort, never()).sendTaskReminderEmail(any(), any(), any(), any(), any(Boolean.class));
    verify(taskPort, times(1)).save(todo);
    verify(emailLogPort, times(1)).save(any());
  }

  @Test
  @DisplayName("Deve disparar e-mail com sucesso para usuário premium dentro do limite de uso justo")
  void shouldSendEmailWhenPremiumUserIsWithinLimit() {
    UUID userId = UUID.randomUUID();
    User premiumUser = new User(
        userId, UserRole.USER, true, "Carlos VIP", "carlosvip", "vip@example.com",
        "hashedpass", BigDecimal.TEN, BigDecimal.TEN, LocalDate.of(1995, 5, 20),
        null, UserGender.MALE, 100, 5, 10, LocalDateTime.now()
    );
    Todo todo = createTestTodo(userId, true, false);

    when(taskPort.findPendingEmailReminders(any(), any())).thenReturn(List.of(todo));
    when(userPort.findById(userId)).thenReturn(Optional.of(premiumUser));
    when(emailLogPort.countByUserIdAndEmailTypeAndStatusAndSentAtAfter(
        eq(userId),
        eq(com.habitparty.core.domain.enums.EmailType.TASK_REMINDER),
        eq(com.habitparty.core.domain.enums.EmailDispatchStatus.SENT),
        any()
    )).thenReturn(25L);
    when(emailPort.sendTaskReminderEmail(any(), any(), any(), any(), any(Boolean.class))).thenReturn(true);

    int count = useCase.execute();

    assertEquals(1, count);
    assertTrue(todo.isEmailReminderSent());
    verify(emailPort, times(1)).sendTaskReminderEmail(
        eq("vip@example.com"),
        eq("Carlos VIP"),
        eq("Estudar Clean Arch"),
        eq(todo.getDueDate().orElse(null)),
        eq(false)
    );
    verify(taskPort, times(1)).save(todo);
    verify(emailLogPort, times(1)).save(any());
  }
}
