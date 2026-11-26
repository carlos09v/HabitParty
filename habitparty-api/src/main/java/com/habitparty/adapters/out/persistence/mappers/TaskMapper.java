package com.habitparty.adapters.out.persistence.mappers;

import java.util.ArrayList;
import java.util.List;

import org.hibernate.Hibernate;
import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.entities.DailyJpaEntity;
import com.habitparty.adapters.out.persistence.entities.HabitJpaEntity;
import com.habitparty.adapters.out.persistence.entities.TaskJpaEntity;
import com.habitparty.adapters.out.persistence.entities.TodoJpaEntity;
import com.habitparty.core.domain.entities.task.ChecklistItem;
import com.habitparty.core.domain.entities.task.Daily;
import com.habitparty.core.domain.entities.task.Habit;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.domain.entities.task.Todo;

@Component
public class TaskMapper {

  /**
   * Converte a entidade para o domínio usando um checklist já carregado em lote pelo adapter.
   * Não acessa a coleção LAZY {@code entity.getChecklist()}, evitando N+1 e LazyInitializationException.
   */
  public Task toDomain(TaskJpaEntity entity, List<ChecklistItem> preloadedChecklist) {
    TaskJpaEntity unwrapped = Hibernate.unproxy(entity, TaskJpaEntity.class);
    List<ChecklistItem> checklist = preloadedChecklist != null ? preloadedChecklist : List.of();

    if (unwrapped instanceof HabitJpaEntity h) {
      Habit habit = new Habit(
          h.getId(), h.getBoardColumnId(), h.getUserId(), h.getName(), h.getDescription(),
          h.getOrderIndex(), h.getPriority(), h.getTags(), h.getDifficulty(),
          h.getStatus(), h.getTaskType(), h.isHardcoreModeEnabled(), h.getDueDate(), h.getCreatedAt(), checklist,
          h.getCurrentStreak(), h.getHabitType(), h.getResetCounter(), h.getImportanceType(), h.getLastCompletedAt(),
          h.getPositiveCount(), h.getNegativeCount());
      habit.restoreHighestStreak(h.getHighestStreak());
      habit.restoreFocusMetrics(h.getTotalFocusMinutes(), h.getFocusCyclesCount());
      return habit;
    } else if (unwrapped instanceof DailyJpaEntity d) {
      Daily daily = new Daily(
          d.getId(), d.getBoardColumnId(), d.getUserId(), d.getName(), d.getDescription(),
          d.getOrderIndex(), d.getPriority(), d.getTags(), d.getDifficulty(),
          d.getStatus(), d.getTaskType(), d.isHardcoreModeEnabled(), d.getDueDate(), d.getCreatedAt(), checklist,
          d.getCurrentStreak(), d.getStartDate(), d.getRepeatType(), d.getRepeatEvery(),
          d.getDaysOfWeek(), d.getMonthlyOption(), d.getLastCompletedAt());
      daily.restoreHighestStreak(d.getHighestStreak());
      daily.restoreFocusMetrics(d.getTotalFocusMinutes(), d.getFocusCyclesCount());
      return daily;
    } else if (unwrapped instanceof TodoJpaEntity t) {
      Todo todo = new Todo(
          t.getId(), t.getBoardColumnId(), t.getUserId(), t.getName(), t.getDescription(),
          t.getOrderIndex(), t.getPriority(), t.getTags(), t.getDifficulty(),
          t.getStatus(), t.getTaskType(), t.isHardcoreModeEnabled(), t.getDueDate(), t.getCreatedAt(), checklist,
          t.getReminderType(), t.getReminderAt(), t.getCompletedAt(), t.isPenaltyApplied(),
          t.isSendEmailReminder(), t.isEmailReminderSent(), t.getDueTime());
      todo.restoreEventSchedule(t.getStartTime(), t.getDueEndTime(), t.isAllDay());
      todo.restoreFocusMetrics(t.getTotalFocusMinutes(), t.getFocusCyclesCount());
      todo.restoreReminderAttempts(t.getReminderAttempts());
      return todo;
    }

    throw new IllegalStateException("Tipo de tarefa desconhecido no banco de dados.");
  }

  public TaskJpaEntity toEntity(Task domain) {
    TaskJpaEntity entity;

    if (domain instanceof Habit h) {
      entity = HabitJpaEntity.builder()
          .id(h.getId())
          .currentStreak(h.getCurrentStreak())
          .highestStreak(h.getHighestStreak())
          .habitType(h.getHabitType())
          .resetCounter(h.getResetCounter())
          .importanceType(h.getImportanceType())
          .lastCompletedAt(h.getLastCompletedAt())
          .positiveCount(h.getPositiveCount())
          .negativeCount(h.getNegativeCount())
          .build();
    } else if (domain instanceof Daily d) {
      entity = DailyJpaEntity.builder()
          .id(d.getId())
          .currentStreak(d.getCurrentStreak())
          .highestStreak(d.getHighestStreak())
          .startDate(d.getStartDate())
          .repeatType(d.getRepeatType())
          .repeatEvery(d.getRepeatEvery())
          .daysOfWeek(d.getDaysOfWeek() != null ? new ArrayList<>(d.getDaysOfWeek()) : null)
          .monthlyOption(d.getMonthlyOpt().orElse(null))
          .lastCompletedAt(d.getLastCompletedAt())
          .build();
    } else if (domain instanceof Todo t) {
      entity = TodoJpaEntity.builder()
          .id(t.getId())
          .dueTime(t.getDueTime().orElse(null))
          .startTime(t.getStartTime().orElse(null))
          .dueEndTime(t.getDueEndTime().orElse(null))
          .isAllDay(t.isAllDay())
          .reminderType(t.getReminderType())
          .reminderAt(t.getReminderAt().orElse(null))
          .completedAt(t.getCompletedAt())
          .isPenaltyApplied(t.isPenaltyApplied())
          .sendEmailReminder(t.isSendEmailReminder())
          .emailReminderSent(t.isEmailReminderSent())
          .reminderAttempts(t.getReminderAttempts())
          .build();
    } else {
      throw new IllegalArgumentException("Tipo de tarefa desconhecido no Domínio.");
    }

    copyCommonFields(entity, domain);
    return entity;
  }

  public void updateEntityFromDomain(TaskJpaEntity entity, Task domain) {
    TaskJpaEntity unwrapped = Hibernate.unproxy(entity, TaskJpaEntity.class);
    copyCommonFields(unwrapped, domain);

    if (domain instanceof Habit h && unwrapped instanceof HabitJpaEntity habitEntity) {
      habitEntity.setCurrentStreak(h.getCurrentStreak());
      habitEntity.setHighestStreak(h.getHighestStreak());
      habitEntity.setHabitType(h.getHabitType());
      habitEntity.setResetCounter(h.getResetCounter());
      habitEntity.setImportanceType(h.getImportanceType());
      habitEntity.setLastCompletedAt(h.getLastCompletedAt());
      habitEntity.setPositiveCount(h.getPositiveCount());
      habitEntity.setNegativeCount(h.getNegativeCount());
    } else if (domain instanceof Daily d && unwrapped instanceof DailyJpaEntity dailyEntity) {
      dailyEntity.setCurrentStreak(d.getCurrentStreak());
      dailyEntity.setHighestStreak(d.getHighestStreak());
      dailyEntity.setStartDate(d.getStartDate());
      dailyEntity.setRepeatType(d.getRepeatType());
      dailyEntity.setRepeatEvery(d.getRepeatEvery());
      dailyEntity.setDaysOfWeek(d.getDaysOfWeek() != null ? new ArrayList<>(d.getDaysOfWeek()) : null);
      dailyEntity.setMonthlyOption(d.getMonthlyOpt().orElse(null));
      dailyEntity.setLastCompletedAt(d.getLastCompletedAt());
    } else if (domain instanceof Todo t && unwrapped instanceof TodoJpaEntity todoEntity) {
      todoEntity.setDueTime(t.getDueTime().orElse(null));
      todoEntity.setStartTime(t.getStartTime().orElse(null));
      todoEntity.setDueEndTime(t.getDueEndTime().orElse(null));
      todoEntity.setAllDay(t.isAllDay());
      todoEntity.setReminderType(t.getReminderType());
      todoEntity.setReminderAt(t.getReminderAt().orElse(null));
      todoEntity.setCompletedAt(t.getCompletedAt());
      todoEntity.setPenaltyApplied(t.isPenaltyApplied());
      todoEntity.setSendEmailReminder(t.isSendEmailReminder());
      todoEntity.setEmailReminderSent(t.isEmailReminderSent());
      todoEntity.setReminderAttempts(t.getReminderAttempts());
    } else {
      throw new IllegalArgumentException(
          "Incompatibilidade entre tipo de tarefa de domínio e entidade persistida.");
    }
  }

  private void copyCommonFields(TaskJpaEntity entity, Task domain) {
    entity.setBoardColumnId(domain.getBoardColumnId());
    entity.setUserId(domain.getUserId());
    entity.setName(domain.getName());
    entity.setDescription(domain.getDescription().orElse(null));
    entity.setOrderIndex(domain.getOrderIndex());
    entity.setPriority(domain.getPriority().orElse(null));
    entity.setTags(domain.getTags() != null ? new ArrayList<>(domain.getTags()) : new ArrayList<>());
    entity.setDifficulty(domain.getDifficulty());
    entity.setStatus(domain.getStatus());
    entity.setTaskType(domain.getTaskType());
    entity.setHardcoreModeEnabled(domain.isHardcoreModeEnabled());
    entity.setDueDate(domain.getDueDate().orElse(null));
    entity.setTotalFocusMinutes(domain.getTotalFocusMinutes());
    entity.setFocusCyclesCount(domain.getFocusCyclesCount());
    if (entity.getCreatedAt() == null) {
      entity.setCreatedAt(domain.getCreatedAt());
    }
  }
}
