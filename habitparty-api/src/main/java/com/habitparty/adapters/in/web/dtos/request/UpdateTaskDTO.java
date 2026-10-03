package com.habitparty.adapters.in.web.dtos.request;

import java.time.LocalDate;
import java.time.LocalDateTime;
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

                @Size(max = 5000, message = "A descrição deve ter até 5000 caracteres.") String description,
                TaskPriority priority,
                List<String> tags,
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
                TodoReminderType reminderType,
                LocalDateTime customReminderAt) {

}
