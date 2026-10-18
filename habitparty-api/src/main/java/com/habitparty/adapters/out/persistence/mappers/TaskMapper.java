package com.habitparty.adapters.out.persistence.mappers;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.entities.ChecklistItemJpaEntity;
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
  private final ChecklistItemMapper checklistMapper;

  public TaskMapper(ChecklistItemMapper checklistMapper) {
    this.checklistMapper = checklistMapper;
  }

  public Task toDomain(TaskJpaEntity entity) {
        List<ChecklistItem> checklist = entity.getChecklist() != null 
            ? entity.getChecklist().stream().map(checklistMapper::toDomain).toList()
            : List.of();

        if (entity instanceof HabitJpaEntity h) {
            return new Habit(
                h.getId(), h.getBoardColumnId(), h.getUserId(), h.getName(), h.getDescription(),
                h.getOrderIndex(), h.getPriority(), h.getTags(), h.getDifficulty(),
                h.getStatus(), h.getTaskType(), h.isHardcoreModeEnabled(), h.getDueDate(), h.getCreatedAt(), checklist,
                h.getCurrentStreak(), h.getHabitType(), h.getResetCounter(), h.getImportanceType(), h.getLastCompletedAt(),
                h.getPositiveCount(), h.getNegativeCount()
            );
        } 
        else if (entity instanceof DailyJpaEntity d) {
            return new Daily(
                d.getId(), d.getBoardColumnId(), d.getUserId(), d.getName(), d.getDescription(),
                d.getOrderIndex(), d.getPriority(), d.getTags(), d.getDifficulty(),
                d.getStatus(), d.getTaskType(), d.isHardcoreModeEnabled(), d.getDueDate(), d.getCreatedAt(), checklist,
                d.getCurrentStreak(), d.getStartDate(), d.getRepeatType(), d.getRepeatEvery(),
                d.getDaysOfWeek(), d.getMonthlyOption(), d.getLastCompletedAt()
            );
        } 
        else if (entity instanceof TodoJpaEntity t) {
            return new Todo(
                t.getId(), t.getBoardColumnId(), t.getUserId(), t.getName(), t.getDescription(),
                t.getOrderIndex(), t.getPriority(), t.getTags(), t.getDifficulty(),
                t.getStatus(), t.getTaskType(), t.isHardcoreModeEnabled(), t.getDueDate(), t.getCreatedAt(), checklist,
                t.getReminderType(), t.getReminderAt(), t.getCompletedAt(), t.isPenaltyApplied(),
                t.isSendEmailReminder(), t.isEmailReminderSent()
            );
        }

        throw new IllegalStateException("Tipo de tarefa desconhecido no banco de dados.");
    }

    public TaskJpaEntity toEntity(Task domain) {
        TaskJpaEntity entity;

        if (domain instanceof Habit h) {
            HabitJpaEntity habitEntity = new HabitJpaEntity();
            habitEntity.setCurrentStreak(h.getCurrentStreak());
            habitEntity.setHabitType(h.getHabitType());
            habitEntity.setResetCounter(h.getResetCounter());
            habitEntity.setImportanceType(h.getImportanceType());
            habitEntity.setLastCompletedAt(h.getLastCompletedAt());
            habitEntity.setPositiveCount(h.getPositiveCount());
            habitEntity.setNegativeCount(h.getNegativeCount());
            entity = habitEntity;
        } 
        else if (domain instanceof Daily d) {
            DailyJpaEntity dailyEntity = new DailyJpaEntity();
            dailyEntity.setCurrentStreak(d.getCurrentStreak());
            dailyEntity.setStartDate(d.getStartDate());
            dailyEntity.setRepeatType(d.getRepeatType());
            dailyEntity.setRepeatEvery(d.getRepeatEvery());
            dailyEntity.setDaysOfWeek(d.getDaysOfWeek());
            dailyEntity.setMonthlyOption(d.getMonthlyOpt().orElse(null));
            dailyEntity.setLastCompletedAt(d.getLastCompletedAt());
            entity = dailyEntity;
        } 
        else if (domain instanceof Todo t) {
            TodoJpaEntity todoEntity = new TodoJpaEntity();
            todoEntity.setReminderType(t.getReminderType());
            todoEntity.setReminderAt(t.getReminderAt().orElse(null));
            todoEntity.setCompletedAt(t.getCompletedAt());
            todoEntity.setPenaltyApplied(t.isPenaltyApplied());
            todoEntity.setSendEmailReminder(t.isSendEmailReminder());
            todoEntity.setEmailReminderSent(t.isEmailReminderSent());
            entity = todoEntity;
        } 
        else {
            throw new IllegalArgumentException("Tipo de tarefa desconhecido no Domínio.");
        }

        // Mapeia os campos comuns da classe Pai
        entity.setId(domain.getId());
        entity.setBoardColumnId(domain.getBoardColumnId());
        entity.setUserId(domain.getUserId());
        entity.setName(domain.getName());
        entity.setDescription(domain.getDescription().orElse(null));
        entity.setOrderIndex(domain.getOrderIndex());
        entity.setPriority(domain.getPriority().orElse(null));
        entity.setTags(domain.getTags());
        entity.setDifficulty(domain.getDifficulty());
        entity.setStatus(domain.getStatus());
        entity.setTaskType(domain.getTaskType());
        entity.setHardcoreModeEnabled(domain.isHardcoreModeEnabled());
        entity.setDueDate(domain.getDueDate().orElse(null));
        entity.setCreatedAt(domain.getCreatedAt());

        if (domain.getChecklist() != null && !domain.getChecklist().isEmpty()) {
            List<ChecklistItemJpaEntity> checklistEntities = domain.getChecklist().stream()
                .map(item -> checklistMapper.toEntity(item, entity))
                .toList();
            entity.setChecklist(new ArrayList<>(checklistEntities));
        }

        return entity;
    }
}
