package com.habitparty.core.domain.entities.task;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.habitparty.core.domain.entities.task.Task.TaskReward;
import com.habitparty.core.domain.enums.task.TaskDifficulty;
import com.habitparty.core.domain.enums.task.TaskPriority;
import com.habitparty.core.domain.enums.task.TaskStatus;
import com.habitparty.core.domain.enums.task.TaskType;
import com.habitparty.core.domain.enums.task.TodoReminderType;
import com.habitparty.core.exceptions.DomainValidationException;

class TodoDomainTest {

  private Todo createTodo(boolean isHardcore, LocalDate dueDate, boolean isPenaltyApplied) {
    return new Todo(
        UUID.randomUUID(),
        UUID.randomUUID(),
        UUID.randomUUID(),
        "Estudar Arquitetura",
        "Revisar ports e adapters",
        0,
        TaskPriority.HIGH,
        List.of("Estudo"),
        TaskDifficulty.MEDIUM,
        TaskStatus.PENDING,
        TaskType.TODO,
        isHardcore,
        dueDate,
        LocalDateTime.now(),
        List.of(),
        TodoReminderType.NONE,
        null,
        null,
        isPenaltyApplied);
  }

  @Test
  @DisplayName("Deve lançar exceção se criar To-do Hardcore sem data de vencimento")
  void shouldThrowExceptionWhenCreatingHardcoreTodoWithoutDueDate() {
    DomainValidationException exception = assertThrows(DomainValidationException.class, () -> {
      createTodo(true, null, false);
    });

    assertEquals("Afazeres no modo Hardcore exigem uma data de vencimento.", exception.getMessage());
  }

  @Test
  @DisplayName("Permite criar To-do comum sem data de vencimento")
  void shouldAllowCreatingRegularTodoWithoutDueDate() {
    Todo todo = createTodo(false, null, false);
    assertFalse(todo.isHardcoreModeEnabled());
    assertTrue(todo.getDueDate().isEmpty());
  }

  @Test
  @DisplayName("Não permite alterar a data de vencimento de um afazer hardcore já vencido")
  void shouldThrowExceptionWhenChangingDueDateOfOverdueHardcoreTodo() {
    LocalDate pastDate = LocalDate.now().minusDays(2);
    Todo todo = createTodo(true, pastDate, true);

    DomainValidationException exception = assertThrows(DomainValidationException.class, () -> {
      todo.updateTodoDetails(LocalDate.now().plusDays(2), TodoReminderType.NONE, null);
    });

    assertEquals("Não é permitido alterar a data de um afazer hardcore com prazo vencido.", exception.getMessage());
  }

  @Test
  @DisplayName("Permite alterar a data de vencimento de um afazer hardcore que ainda não venceu")
  void shouldAllowChangingDueDateOfFutureHardcoreTodo() {
    LocalDate futureDate = LocalDate.now().plusDays(3);
    Todo todo = createTodo(true, futureDate, false);

    LocalDate newFutureDate = LocalDate.now().plusDays(5);
    todo.updateTodoDetails(newFutureDate, TodoReminderType.NONE, null);

    assertEquals(newFutureDate, todo.getDueDate().orElse(null));
  }

  @Test
  @DisplayName("Não permite desativar o modo Hardcore de uma tarefa vencida")
  void shouldThrowExceptionWhenDisablingHardcoreOnOverdueTask() {
    LocalDate pastDate = LocalDate.now().minusDays(1);
    Todo todo = createTodo(true, pastDate, true);

    DomainValidationException exception = assertThrows(DomainValidationException.class, () -> {
      todo.updateBaseDetails(
          todo.getName(),
          todo.getDescription().orElse(null),
          todo.getPriority().orElse(null),
          todo.getDifficulty(),
          todo.getTags(),
          false // Tentando desligar o modo hardcore
      );
    });

    assertEquals("Não é permitido desativar o modo Hardcore de uma tarefa com prazo vencido.", exception.getMessage());
  }

  @Test
  @DisplayName("Calcula recompensa cheia (100%) quando a penalidade não foi aplicada")
  void shouldCalculateFullRewardWhenPenaltyNotApplied() {
    Todo todo = createTodo(true, LocalDate.now().plusDays(1), false);

    TaskReward reward = todo.calculateReward();

    // Dificuldade MEDIUM: Base é 15 XP e $2.50
    assertEquals(15, reward.xp());
    assertEquals(new BigDecimal("2.50"), reward.coins());
  }

  @Test
  @DisplayName("Calcula recompensa reduzida (50%) quando a penalidade já foi aplicada")
  void shouldCalculateReducedRewardWhenPenaltyApplied() {
    Todo todo = createTodo(true, LocalDate.now().minusDays(1), true);

    TaskReward reward = todo.calculateReward();

    // Dificuldade MEDIUM com 50%: 7 XP e $1.25
    assertEquals(7, reward.xp());
    assertEquals(new BigDecimal("1.25"), reward.coins());
  }

  @Test
  @DisplayName("Calcula recompensa reduzida (50%) quando a tarefa hardcore está vencida mesmo antes de rodar o reset da meia-noite")
  void shouldCalculateReducedRewardWhenHardcoreTodoIsOverdueEvenIfPenaltyNotYetApplied() {
    Todo todo = createTodo(true, LocalDate.now().minusDays(1), false);

    TaskReward reward = todo.calculateReward();

    assertEquals(7, reward.xp());
    assertEquals(new BigDecimal("1.25"), reward.coins());
  }

  @Test
  @DisplayName("Deve gerenciar status de envio de e-mail e resetar flag quando horário do lembrete for alterado")
  void shouldManageEmailReminderFlagsAndResetWhenReminderTimeChanges() {
    LocalDateTime initialReminder = LocalDateTime.now().plusHours(2);
    Todo todo = new Todo(
        UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(),
        "Tarefa com Lembrete", "Descrição", 0, TaskPriority.HIGH,
        List.of(), TaskDifficulty.EASY, TaskStatus.PENDING, TaskType.TODO,
        false, LocalDate.now().plusDays(2), LocalDateTime.now(), List.of(),
        TodoReminderType.CUSTOM, initialReminder, null, false, true, false
    );

    assertTrue(todo.isSendEmailReminder());
    assertFalse(todo.isEmailReminderSent());

    // Marca como enviado
    todo.markEmailReminderSent();
    assertTrue(todo.isEmailReminderSent());

    // Atualiza com novo horário de alarme -> emailReminderSent deve resetar para false
    LocalDateTime newReminder = LocalDateTime.now().plusHours(4);
    todo.updateTodoDetails(LocalDate.now().plusDays(2), TodoReminderType.CUSTOM, newReminder, true);
    assertFalse(todo.isEmailReminderSent());
    assertTrue(todo.isSendEmailReminder());

    // Desativa o lembrete por e-mail -> sendEmailReminder fica false e emailReminderSent false
    todo.markEmailReminderSent();
    assertTrue(todo.isEmailReminderSent());
    todo.updateTodoDetails(LocalDate.now().plusDays(2), TodoReminderType.CUSTOM, newReminder, false);
    assertFalse(todo.isSendEmailReminder());
    assertFalse(todo.isEmailReminderSent());
  }

  @Test
  @DisplayName("Deve definir a data de hoje automaticamente se informar horário (dueTime) sem data (dueDate)")
  void shouldAutoSetTodayDueDateWhenDueTimeProvidedWithoutDueDate() {
    java.time.LocalTime dueTime = java.time.LocalTime.of(14, 30);
    Todo todo = new Todo(
        UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(),
        "Tarefa com Horário", "Descrição", 0, TaskPriority.MEDIUM,
        List.of(), TaskDifficulty.EASY, TaskStatus.PENDING, TaskType.TODO,
        false, null, LocalDateTime.now(), List.of(),
        TodoReminderType.NONE, null, null, false, false, false, dueTime
    );

    assertEquals(LocalDate.now(), todo.getDueDate().orElse(null));
    assertEquals(dueTime, todo.getDueTime().orElse(null));
  }

  private Todo buildTodoWithTime(java.time.LocalTime dueTime) {
    return new Todo(
        UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(),
        "Evento", "Descrição", 0, TaskPriority.MEDIUM,
        List.of(), TaskDifficulty.EASY, TaskStatus.PENDING, TaskType.TODO,
        false, LocalDate.now().plusDays(1), LocalDateTime.now(), List.of(),
        TodoReminderType.NONE, null, null, false, false, false, dueTime
    );
  }

  @Test
  @DisplayName("Deve definir o horário de término quando posterior ao horário de início")
  void shouldDefineDueEndTimeWhenAfterStart() {
    Todo todo = buildTodoWithTime(java.time.LocalTime.of(14, 0));
    todo.defineDueEndTime(java.time.LocalTime.of(18, 0));
    assertEquals(java.time.LocalTime.of(18, 0), todo.getDueEndTime().orElse(null));
  }

  @Test
  @DisplayName("Deve rejeitar horário de término sem horário de início")
  void shouldRejectDueEndTimeWithoutStart() {
    Todo todo = buildTodoWithTime(null);
    assertThrows(com.habitparty.core.exceptions.DomainValidationException.class,
        () -> todo.defineDueEndTime(java.time.LocalTime.of(18, 0)));
  }

  @Test
  @DisplayName("Deve rejeitar horário de término igual ou anterior ao início")
  void shouldRejectDueEndTimeNotAfterStart() {
    Todo todo = buildTodoWithTime(java.time.LocalTime.of(14, 0));
    assertThrows(com.habitparty.core.exceptions.DomainValidationException.class,
        () -> todo.defineDueEndTime(java.time.LocalTime.of(14, 0)));
    assertThrows(com.habitparty.core.exceptions.DomainValidationException.class,
        () -> todo.defineDueEndTime(java.time.LocalTime.of(9, 0)));
  }

  @Test
  @DisplayName("Deve limpar o término quando o horário de início for removido ou passar a ser posterior")
  void shouldClearDueEndTimeWhenStartRemovedOrMovedAfterEnd() {
    Todo todo = buildTodoWithTime(java.time.LocalTime.of(14, 0));
    todo.defineDueEndTime(java.time.LocalTime.of(18, 0));

    todo.updateTodoDetails(LocalDate.now().plusDays(1), java.time.LocalTime.of(19, 0), TodoReminderType.NONE, null, null);
    assertTrue(todo.getDueEndTime().isEmpty());

    todo.defineDueEndTime(java.time.LocalTime.of(20, 0));
    todo.updateTodoDetails(LocalDate.now().plusDays(1), null, TodoReminderType.NONE, null, null);
    assertTrue(todo.getDueEndTime().isEmpty());
  }

  @Test
  @DisplayName("Deve descartar término inconsistente ao reidratar da persistência")
  void shouldDiscardInconsistentDueEndTimeOnRestore() {
    Todo todo = buildTodoWithTime(java.time.LocalTime.of(14, 0));
    todo.restoreDueEndTime(java.time.LocalTime.of(10, 0));
    assertTrue(todo.getDueEndTime().isEmpty());
    todo.restoreDueEndTime(java.time.LocalTime.of(16, 0));
    assertEquals(java.time.LocalTime.of(16, 0), todo.getDueEndTime().orElse(null));
  }

  @Test
  @DisplayName("Deve garantir exclusividade mútua entre Hora pontual (dueTime) e Evento (startTime/dueEndTime ou isAllDay)")
  void shouldEnforceMutualExclusivityBetweenDueTimeAndEvent() {
    Todo todo = buildTodoWithTime(java.time.LocalTime.of(15, 0));
    assertEquals(java.time.LocalTime.of(15, 0), todo.getDueTime().orElse(null));

    // Ao definir intervalo de evento (startTime + dueEndTime), limpa dueTime
    todo.defineEventSchedule(java.time.LocalTime.of(14, 0), java.time.LocalTime.of(16, 0), false);
    assertTrue(todo.getDueTime().isEmpty());
    assertEquals(java.time.LocalTime.of(14, 0), todo.getStartTime().orElse(null));
    assertEquals(java.time.LocalTime.of(16, 0), todo.getDueEndTime().orElse(null));
    assertFalse(todo.isAllDay());

    // Ao marcar Dia Inteiro (isAllDay), limpa startTime, dueEndTime e dueTime
    todo.defineEventSchedule(null, null, true);
    assertTrue(todo.isAllDay());
    assertTrue(todo.getDueTime().isEmpty());
    assertTrue(todo.getStartTime().isEmpty());
    assertTrue(todo.getDueEndTime().isEmpty());

    // Ao voltar para Hora pontual (dueTime), limpa isAllDay e startTime
    todo.updateTodoDetails(LocalDate.now().plusDays(1), java.time.LocalTime.of(17, 30), TodoReminderType.NONE, null, null);
    assertEquals(java.time.LocalTime.of(17, 30), todo.getDueTime().orElse(null));
    assertFalse(todo.isAllDay());
    assertTrue(todo.getStartTime().isEmpty());
  }

  @Test
  @DisplayName("Normaliza e aceita tags hierárquicas válidas preservando o caminho completo")
  void shouldNormalizeAndAcceptValidNestedTags() {
    Todo todo = createTodo(false, null, false);
    todo.updateBaseDetails(
        todo.getName(),
        todo.getDescription().orElse(null),
        todo.getPriority().orElse(null),
        todo.getDifficulty(),
        List.of("  Concurso>BB  ", "Estudo > Arquitetura > Java"),
        false);

    assertEquals(List.of("Concurso > BB", "Estudo > Arquitetura > Java"), todo.getTags());
  }

  @Test
  @DisplayName("Rejeita nível de tag hierárquica acima de 25 caracteres ou nível vazio")
  void shouldRejectOversizedOrMalformedNestedTagSegments() {
    Todo todo = createTodo(false, null, false);

    assertThrows(DomainValidationException.class, () ->
        todo.updateBaseDetails(
            todo.getName(),
            todo.getDescription().orElse(null),
            todo.getPriority().orElse(null),
            todo.getDifficulty(),
            List.of("Concurso > SegmentoComMaisDeVinteECincoChars"),
            false));

    assertThrows(DomainValidationException.class, () ->
        todo.updateBaseDetails(
            todo.getName(),
            todo.getDescription().orElse(null),
            todo.getPriority().orElse(null),
            todo.getDifficulty(),
            List.of("Concurso > "),
            false));

    assertThrows(DomainValidationException.class, () ->
        todo.updateBaseDetails(
            todo.getName(),
            todo.getDescription().orElse(null),
            todo.getPriority().orElse(null),
            todo.getDifficulty(),
            List.of("NivelUmVinteCincoChars123 > NivelDoisVinteCincoChars > NivelTresVinteCincoCh1 > Nivel4"),
            false));
  }

  @Test
  @DisplayName("To-Do Difícil escala recompensa por etapa recompensada até o limite de 4 e protege etapas já concluídas da penalidade")
  void scalesRewardWithRewardedChecklistStepsAndProtectsCompletedStepsFromPenalty() {
    UUID userId = UUID.randomUUID();
    UUID taskId = UUID.randomUUID();
    LocalDate yesterday = LocalDate.now().minusDays(1);

    List<ChecklistItem> steps = List.of(
        new ChecklistItem(UUID.randomUUID(), taskId, userId, "Etapa 1", true, true),
        new ChecklistItem(UUID.randomUUID(), taskId, userId, "Etapa 2", false, true),
        new ChecklistItem(UUID.randomUUID(), taskId, userId, "Etapa 3", false, true),
        new ChecklistItem(UUID.randomUUID(), taskId, userId, "Subtask padrão", false, false));

    Todo hardOnTimeTodo = new Todo(
        taskId, UUID.randomUUID(), userId, "Projeto Difícil", null, 0,
        TaskPriority.HIGH, List.of(), TaskDifficulty.HARD, TaskStatus.PENDING,
        TaskType.TODO, true, LocalDate.now().plusDays(1), LocalDateTime.now(),
        steps, TodoReminderType.NONE, null, null, false);

    // Base HARD = 30 XP / $5.00. Com 3 etapas recompensadas = 4 unidades -> 120 XP / $20.00
    TaskReward fullReward = hardOnTimeTodo.calculateReward(LocalDate.now());
    assertEquals(120, fullReward.xp());
    assertEquals(0, new BigDecimal("20.00").compareTo(fullReward.coins()));

    Todo hardOverdueTodo = new Todo(
        taskId, UUID.randomUUID(), userId, "Projeto Atrasado", null, 0,
        TaskPriority.HIGH, List.of(), TaskDifficulty.HARD, TaskStatus.PENDING,
        TaskType.TODO, true, yesterday, LocalDateTime.now(),
        steps, TodoReminderType.NONE, null, null, false);

    // Penalidade só incide sobre base (1) + pendentes (2) = 3 unidades -> 50% de 90 XP / $15.00 = 45 XP / $7.50
    TaskReward penalty = hardOverdueTodo.calculatePenalty(LocalDate.now());
    assertEquals(45, penalty.xp());
    assertEquals(0, new BigDecimal("7.50").compareTo(penalty.coins()));

    // Conclusão tardia recebe 50% sobre o card consolidado inteiro (4 unidades) = 60 XP / $10.00
    TaskReward lateReward = hardOverdueTodo.calculateReward(LocalDate.now());
    assertEquals(60, lateReward.xp());
    assertEquals(0, new BigDecimal("10.00").compareTo(lateReward.coins()));
  }

  @Test
  @DisplayName("To-Do não-Difícil ignora etapas marcadas como recompensadas e valida limite de 4 no Difícil")
  void nonHardTodoIgnoresRewardedStepsAndHardValidatesMaxLimit() {
    UUID userId = UUID.randomUUID();
    UUID taskId = UUID.randomUUID();
    List<ChecklistItem> fiveRewarded = List.of(
        new ChecklistItem(UUID.randomUUID(), taskId, userId, "1", false, true),
        new ChecklistItem(UUID.randomUUID(), taskId, userId, "2", false, true),
        new ChecklistItem(UUID.randomUUID(), taskId, userId, "3", false, true),
        new ChecklistItem(UUID.randomUUID(), taskId, userId, "4", false, true),
        new ChecklistItem(UUID.randomUUID(), taskId, userId, "5", false, true));

    Todo mediumTodo = new Todo(
        taskId, UUID.randomUUID(), userId, "Médio", null, 0,
        TaskPriority.MEDIUM, List.of(), TaskDifficulty.MEDIUM, TaskStatus.PENDING,
        TaskType.TODO, false, null, LocalDateTime.now(),
        fiveRewarded, TodoReminderType.NONE, null, null, false);

    TaskReward mediumReward = mediumTodo.calculateReward(LocalDate.now());
    assertEquals(15, mediumReward.xp());
    assertEquals(0, new BigDecimal("2.50").compareTo(mediumReward.coins()));

    Todo hardTodoCapped = new Todo(
        taskId, UUID.randomUUID(), userId, "Difícil", null, 0,
        TaskPriority.HIGH, List.of(), TaskDifficulty.HARD, TaskStatus.PENDING,
        TaskType.TODO, false, null, LocalDateTime.now(),
        fiveRewarded, TodoReminderType.NONE, null, null, false);

    // Teto máximo de 4 etapas -> 5 unidades (150 XP / $25.00), mesmo se houver 5 flags legadas
    TaskReward hardMaxReward = hardTodoCapped.calculateReward(LocalDate.now());
    assertEquals(150, hardMaxReward.xp());
    assertEquals(0, new BigDecimal("25.00").compareTo(hardMaxReward.coins()));
    assertThrows(DomainValidationException.class, () -> hardTodoCapped.validateCanRewardChecklistItem(null));
  }
}
