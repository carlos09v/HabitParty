package com.habitparty.adapters.in.web.dtos.request;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import com.habitparty.core.domain.enums.task.DailyDaysOfWeek;
import com.habitparty.core.domain.enums.task.DailyRepeatMonthlyOption;
import com.habitparty.core.domain.enums.task.DailyRepeatType;
import com.habitparty.core.domain.enums.task.HabitImportanceType;
import com.habitparty.core.domain.enums.task.HabitResetCounter;
import com.habitparty.core.domain.enums.task.HabitType;
import com.habitparty.core.domain.enums.task.TaskDifficulty;
import com.habitparty.core.domain.enums.task.TaskPriority;
import com.habitparty.core.domain.enums.task.TodoReminderType;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;

@Schema(example = """
                {
                  "name": "New task",
                  "description": "...",
                  "priority": "MEDIUM",
                  "tags": ["etc"],
                  "isHardcoreModeEnabled": false,
                  "dueDate": "2026-09-27"
                }
                """)
public record UpdateTaskDTO(
                // Base
                @Size(max = 50, message = "O nome deve ter até 50 caracteres.") String name,

                @Size(max = 2000, message = "A descrição deve ter até 2000 caracteres.") String description,
                TaskPriority priority,
                @Size(max = 5, message = "Uma tarefa pode ter no máximo 5 tags.")
                List<@Size(max = 80, message = "Cada tag deve ter até 80 caracteres.") String> tags,
                TaskDifficulty difficulty,
                boolean isHardcoreModeEnabled,
                LocalDate dueDate,

                // Habit
                HabitType habitType,
                HabitResetCounter resetCounter,
                HabitImportanceType importanceType,

                // Daily
                LocalDate startDate,
                DailyRepeatType repeatType,
                Integer repeatEvery,
                List<DailyDaysOfWeek> daysOfWeek,
                DailyRepeatMonthlyOption monthlyOption,

                // Todo
                LocalTime dueTime,
                TodoReminderType reminderType,
                LocalDateTime customReminderAt,
                Boolean sendEmailReminder,
                LocalTime startTime,
                LocalTime dueEndTime,
                Boolean isAllDay) {

}
