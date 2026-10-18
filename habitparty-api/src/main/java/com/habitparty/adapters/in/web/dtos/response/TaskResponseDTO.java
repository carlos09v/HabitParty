package com.habitparty.adapters.in.web.dtos.response;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.habitparty.core.domain.entities.task.Daily;
import com.habitparty.core.domain.entities.task.Habit;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.domain.entities.task.Todo;
import com.habitparty.core.domain.enums.task.DailyDaysOfWeek;
import com.habitparty.core.domain.enums.task.DailyRepeatMonthlyOption;
import com.habitparty.core.domain.enums.task.DailyRepeatType;
import com.habitparty.core.domain.enums.task.HabitImportanceType;
import com.habitparty.core.domain.enums.task.HabitResetCounter;
import com.habitparty.core.domain.enums.task.HabitType;
import com.habitparty.core.domain.enums.task.TaskDifficulty;
import com.habitparty.core.domain.enums.task.TaskPriority;
import com.habitparty.core.domain.enums.task.TaskStatus;
import com.habitparty.core.domain.enums.task.TaskType;
import com.habitparty.core.domain.enums.task.TodoReminderType;

@JsonInclude(JsonInclude.Include.NON_NULL) // Oculta tudo que for null do JSON
public record TaskResponseDTO(
        UUID id,
        String name,
        String description,
        int orderIndex,
        TaskPriority priority,
        TaskDifficulty difficulty,
        TaskStatus status,
        TaskType taskType,
        List<String> tags,
        boolean isHardcoreModeEnabled,
        LocalDate dueDate,

        // --- Campos de Hábito e Daily ---
        Integer currentStreak,

        // --- Campos específicos de Hábito ---
        HabitType habitType,
        HabitResetCounter resetCounter,
        HabitImportanceType importanceType,
        Integer positiveCount,
        Integer negativeCount,

        // --- Campos específicos de Daily ---
        LocalDate startDate,
        DailyRepeatType repeatType,
        Integer repeatEvery, // Alterado para Integer para permitir null
        List<DailyDaysOfWeek> daysOfWeek,
        DailyRepeatMonthlyOption monthlyOption,

        // --- Campos específicos de Todo ---
        TodoReminderType reminderType,
        LocalDateTime reminderAt,
        Boolean isPenaltyApplied,
        Boolean sendEmailReminder,
        Boolean emailReminderSent,

        // --- A lista de Checklist ---
        List<ChecklistItemResponseDTO> checklist) {
    public static TaskResponseDTO fromDomain(Task task) {
        // Converte o checklist para DTO (se existir)
        List<ChecklistItemResponseDTO> checklistDTOs = task.getChecklist() != null
                ? task.getChecklist().stream().map(ChecklistItemResponseDTO::fromDomain).toList()
                : List.of();

        // Montagem do DTO dinâmico
        return new TaskResponseDTO(
                task.getId(),
                task.getName(),
                task.getDescription().orElse(null),
                task.getOrderIndex(),
                task.getPriority().orElse(null),
                task instanceof Habit ? null : task.getDifficulty(),
                task.getStatus(),
                task.getTaskType(),
                task.getTags(),
                task.isHardcoreModeEnabled(),
                task.getDueDate().orElse(null),

                // --- A Mágica do Java para extrair campos das subclasses ---

                // currentStreak (Existe no Habit e no Daily)
                task instanceof Habit h ? (Integer) h.getCurrentStreak()
                        : task instanceof Daily d ? (Integer) d.getCurrentStreak() : null,

                // Específicos do Habit
                task instanceof Habit h ? h.getHabitType() : null,
                task instanceof Habit h ? h.getResetCounter() : null,
                task instanceof Habit h ? h.getImportanceType() : null,
                task instanceof Habit h ? (Integer) h.getPositiveCount() : null,
                task instanceof Habit h ? (Integer) h.getNegativeCount() : null,

                // Específicos do Daily
                task instanceof Daily d ? d.getStartDate() : null,
                task instanceof Daily d ? d.getRepeatType() : null,
                task instanceof Daily d ? (Integer) d.getRepeatEvery() : null,
                task instanceof Daily d ? d.getDaysOfWeek() : null,
                task instanceof Daily d ? d.getMonthlyOpt().orElse(null) : null,

                // Específicos do Todo
                task instanceof Todo t ? t.getReminderType() : null,
                task instanceof Todo t ? t.getReminderAt().orElse(null) : null,
                task instanceof Todo t ? t.isPenaltyApplied() : null,
                task instanceof Todo t ? t.isSendEmailReminder() : null,
                task instanceof Todo t ? t.isEmailReminderSent() : null,

                checklistDTOs);
    }
}
