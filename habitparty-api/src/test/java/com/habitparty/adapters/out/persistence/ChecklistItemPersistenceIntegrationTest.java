package com.habitparty.adapters.out.persistence;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

import com.habitparty.application.ports.BoardColumnRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.ports.WorkspaceRepository;
import com.habitparty.application.usecases.task.checklistItem.DeleteChecklistItemUseCase;
import com.habitparty.application.usecases.task.checklistItem.ToggleChecklistItemRewardUseCase;
import com.habitparty.application.usecases.task.checklistItem.ToggleChecklistItemUseCase;
import com.habitparty.application.usecases.task.checklistItem.UpdateChecklistItemUseCase;
import com.habitparty.core.domain.entities.BoardColumn;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.Workspace;
import com.habitparty.core.domain.entities.task.ChecklistItem;
import com.habitparty.core.domain.entities.task.Daily;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.domain.entities.task.Todo;
import com.habitparty.core.domain.enums.SubscriptionStatus;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserRole;
import com.habitparty.core.domain.enums.task.DailyRepeatType;
import com.habitparty.core.domain.enums.task.TaskDifficulty;
import com.habitparty.core.domain.enums.task.TaskPriority;
import com.habitparty.core.domain.enums.task.TaskStatus;
import com.habitparty.core.domain.enums.task.TaskType;
import com.habitparty.core.domain.enums.task.TodoReminderType;

@SpringBootTest
class ChecklistItemPersistenceIntegrationTest {

  @Autowired
  private UserRepository userRepository;

  @Autowired
  private WorkspaceRepository workspaceRepository;

  @Autowired
  private BoardColumnRepository boardColumnRepository;

  @Autowired
  private TaskRepository taskRepository;

  @Autowired
  private ToggleChecklistItemUseCase toggleChecklistItemUseCase;

  @Autowired
  private ToggleChecklistItemRewardUseCase toggleChecklistItemRewardUseCase;

  @Autowired
  private UpdateChecklistItemUseCase updateChecklistItemUseCase;

  @Autowired
  private DeleteChecklistItemUseCase deleteChecklistItemUseCase;

  @Autowired
  private TransactionTemplate transactionTemplate;

  @Autowired
  private JdbcTemplate jdbcTemplate;

  @BeforeEach
  void ensureTaskTablesExistInH2() {
    jdbcTemplate.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
          task_id UUID PRIMARY KEY,
          board_column_id UUID NOT NULL,
          user_id UUID NOT NULL,
          name VARCHAR(255) NOT NULL,
          description VARCHAR(2000),
          order_index INT NOT NULL,
          priority VARCHAR(50),
          tags VARCHAR ARRAY,
          difficulty VARCHAR(50) NOT NULL,
          status VARCHAR(50) NOT NULL,
          task_type VARCHAR(50) NOT NULL,
          is_hardcore_mode_enabled BOOLEAN NOT NULL,
          due_date DATE,
          total_focus_minutes INT NOT NULL DEFAULT 0,
          focus_cycles_count INT NOT NULL DEFAULT 0,
          created_at TIMESTAMP NOT NULL
        )
        """);
    jdbcTemplate.execute("""
        CREATE TABLE IF NOT EXISTS daily (
          task_id UUID PRIMARY KEY,
          current_streak INT NOT NULL,
          highest_streak INT NOT NULL DEFAULT 0,
          start_date DATE NOT NULL,
          repeat_type VARCHAR(50) NOT NULL,
          repeat_every INT NOT NULL,
          days_of_week VARCHAR ARRAY,
          repeat_monthly_option VARCHAR(50),
          last_completed_at TIMESTAMP
        )
        """);
    jdbcTemplate.execute("""
        CREATE TABLE IF NOT EXISTS todo (
          task_id UUID PRIMARY KEY,
          due_time TIME,
          start_time TIME,
          due_end_time TIME,
          is_all_day BOOLEAN NOT NULL DEFAULT FALSE,
          reminder_type VARCHAR(50) NOT NULL,
          reminder_at TIMESTAMP,
          completed_at TIMESTAMP,
          is_penalty_applied BOOLEAN NOT NULL DEFAULT FALSE,
          send_email_reminder BOOLEAN NOT NULL DEFAULT FALSE,
          email_reminder_sent BOOLEAN NOT NULL DEFAULT FALSE
        )
        """);
    jdbcTemplate.execute("""
        CREATE TABLE IF NOT EXISTS habit (
          task_id UUID PRIMARY KEY,
          current_streak INT NOT NULL,
          highest_streak INT NOT NULL DEFAULT 0,
          habit_type VARCHAR(50) NOT NULL,
          reset_counter VARCHAR(50) NOT NULL,
          importance_type VARCHAR(50) NOT NULL,
          last_completed_at TIMESTAMP,
          positive_count INT NOT NULL DEFAULT 0,
          negative_count INT NOT NULL DEFAULT 0
        )
        """);
    jdbcTemplate.execute("""
        CREATE TABLE IF NOT EXISTS checklist_item (
          checklist_item_id UUID PRIMARY KEY,
          task_id UUID NOT NULL,
          user_id UUID NOT NULL,
          name VARCHAR(255) NOT NULL,
          is_completed BOOLEAN NOT NULL DEFAULT FALSE,
          is_rewarded BOOLEAN NOT NULL DEFAULT FALSE,
          order_index INT NOT NULL DEFAULT 0,
          auto_completed BOOLEAN NOT NULL DEFAULT FALSE
        )
        """);
  }

  @Test
  @DisplayName("Toggle de checklist e de recompensa em transação JPA real não deve falhar com proxy de TaskJpaEntity")
  void togglingChecklistCompletionAndRewardShouldNotFailWithLazyTaskProxy() {
    String suffix = UUID.randomUUID().toString().substring(0, 8);
    User user = new User(
        UUID.randomUUID(),
        UserRole.USER,
        false,
        false,
        null,
        null,
        SubscriptionStatus.FREE,
        null,
        "Checklist Bug Repro " + suffix,
        "chk_" + suffix,
        "chk_" + suffix + "@habitparty.com",
        "hashed_password",
        true,
        LocalDateTime.now(),
        BigDecimal.ZERO,
        BigDecimal.ZERO,
        LocalDate.of(1995, 5, 10),
        null,
        UserGender.PREFER_NOT_TO_SAY,
        0,
        0,
        0,
        LocalDateTime.now());
    user.initializeTimezone(User.DEFAULT_TIMEZONE, Clock.systemUTC());
    User savedUser = userRepository.save(user);

    UUID workspaceId = UUID.randomUUID();
    Workspace savedWorkspace = workspaceRepository.save(new Workspace(workspaceId, savedUser.getId(), "Ambiente Teste"));
    BoardColumn savedColumn = boardColumnRepository.save(
        new BoardColumn(UUID.randomUUID(), savedUser.getId(), savedWorkspace.getId(), "A Fazer", 0, null, true));

    UUID taskId = UUID.randomUUID();
    UUID itemId = UUID.randomUUID();
    ChecklistItem item = new ChecklistItem(itemId, taskId, savedUser.getId(), "Etapa 1", true, true, 0, false);
    Todo todo = new Todo(
        taskId,
        savedColumn.getId(),
        savedUser.getId(),
        "Afazer Difícil",
        null,
        0,
        TaskPriority.HIGH,
        List.of(),
        TaskDifficulty.HARD,
        TaskStatus.PENDING,
        TaskType.TODO,
        false,
        null,
        LocalDateTime.now(),
        List.of(),
        TodoReminderType.NONE,
        null,
        null);
    taskRepository.save(todo);
    taskRepository.saveChecklistItem(item);

    try {
      // Simula exatamente os cliques no TaskDetailsPopover com PersistenceContext limpo:
      // 1) Desmarcar o checkbox do checklist
      ChecklistItem unchecked = toggleChecklistItemUseCase.execute(itemId, savedUser.getId());
      assertFalse(unchecked.isCompleted());

      // 2) Desmarcar rewarded do checklist
      ChecklistItem unrewarded = toggleChecklistItemRewardUseCase.execute(itemId, savedUser.getId());
      assertFalse(unrewarded.isRewarded());

      // 3) Remarcar rewarded do checklist
      ChecklistItem reRewarded = toggleChecklistItemRewardUseCase.execute(itemId, savedUser.getId());
      assertTrue(reRewarded.isRewarded());

      // 4) Atualizar nome mantendo rewarded
      ChecklistItem renamed = updateChecklistItemUseCase.execute(itemId, savedUser.getId(), "Etapa 1 Editada", true);
      assertTrue(renamed.isRewarded());
    } finally {
      taskRepository.deleteById(taskId);
      boardColumnRepository.deleteById(savedColumn.getId());
      workspaceRepository.deleteById(savedWorkspace.getId());
      userRepository.deleteById(savedUser.getId());
    }
  }

  @Test
  @DisplayName("findById na mesma transação após saveChecklistItem e DeleteChecklistItemUseCase deve mapear Daily sem erro de proxy")
  void findByIdAfterSaveChecklistItemInSameTransactionWorksForDaily() {
    String suffix = UUID.randomUUID().toString().substring(0, 8);
    User user = new User(
        UUID.randomUUID(),
        UserRole.USER,
        false,
        false,
        null,
        null,
        SubscriptionStatus.FREE,
        null,
        "Daily Proxy Test " + suffix,
        "dly_" + suffix,
        "dly_" + suffix + "@habitparty.com",
        "hashed_password",
        true,
        LocalDateTime.now(),
        BigDecimal.ZERO,
        BigDecimal.ZERO,
        LocalDate.of(1995, 5, 10),
        null,
        UserGender.PREFER_NOT_TO_SAY,
        0,
        0,
        0,
        LocalDateTime.now());
    user.initializeTimezone(User.DEFAULT_TIMEZONE, Clock.systemUTC());
    User savedUser = userRepository.save(user);

    Workspace savedWorkspace = workspaceRepository.save(
        new Workspace(UUID.randomUUID(), savedUser.getId(), "Ambiente Daily"));
    BoardColumn savedColumn = boardColumnRepository.save(
        new BoardColumn(UUID.randomUUID(), savedUser.getId(), savedWorkspace.getId(), "Diárias", 0, null, true));

    UUID dailyId = UUID.randomUUID();
    Daily daily = new Daily(
        dailyId,
        savedColumn.getId(),
        savedUser.getId(),
        "Diária Difícil",
        null,
        0,
        TaskPriority.HIGH,
        List.of(),
        TaskDifficulty.HARD,
        TaskStatus.PENDING,
        TaskType.DAILY,
        false,
        LocalDate.now(),
        LocalDateTime.now(),
        List.of(),
        0,
        LocalDate.now(),
        DailyRepeatType.DAILY,
        1,
        List.of(),
        null,
        null);
    taskRepository.save(daily);

    UUID itemId = UUID.randomUUID();
    ChecklistItem item = new ChecklistItem(itemId, dailyId, savedUser.getId(), "Etapa Diária", true, true, 0, false);

    try {
      transactionTemplate.executeWithoutResult(status -> {
        taskRepository.saveChecklistItem(item);
        Task loadedDaily = taskRepository.findById(dailyId).orElseThrow();
        assertTrue(loadedDaily instanceof Daily);
        assertTrue(loadedDaily.getChecklist().getFirst().isRewarded());
      });

      ChecklistItem toggled = toggleChecklistItemRewardUseCase.execute(itemId, savedUser.getId());
      assertFalse(toggled.isRewarded());
      deleteChecklistItemUseCase.execute(itemId, savedUser.getId());
    } finally {
      taskRepository.deleteById(dailyId);
      boardColumnRepository.deleteById(savedColumn.getId());
      workspaceRepository.deleteById(savedWorkspace.getId());
      userRepository.deleteById(savedUser.getId());
    }
  }
}
