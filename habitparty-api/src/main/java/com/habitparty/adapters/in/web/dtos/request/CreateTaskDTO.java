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
import com.habitparty.core.domain.enums.task.TaskType;
import com.habitparty.core.domain.enums.task.TodoReminderType;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Schema(example = """
    {
      "name": "Estudar Spring Boot",
      "description": "Revisar Clean Architecture e DDD.",
      "priority": "MEDIUM",
      "tags": ["estudos"],
      "difficulty": "MEDIUM",
      "taskType": "",
      "isHardcoreModeEnabled": false
    }
    """)
public record CreateTaskDTO(
    // --- Campos Base (Comuns a todas as tarefas) ---
    @NotBlank(message = "O nome é obrigatório.") @Size(max = 50, message = "O nome deve ter até 50 caracteres.") String name,

    @Size(max = 5000, message = "A descrição deve ter até 5000 caracteres.") String description,

    TaskPriority priority,

    @Size(max = 5, message = "Uma tarefa pode ter no máximo 5 tags.")
    List<@Size(max = 25, message = "Cada tag deve ter até 25 caracteres.") String> tags,

    TaskDifficulty difficulty,

    @NotNull(message = "O tipo da tarefa (HABIT, DAILY, TODO) é obrigatório.") TaskType taskType,

    boolean isHardcoreModeEnabled,

    LocalDate dueDate,

    // --- Campos Específicos de Hábito ---
    HabitType habitType,
    HabitResetCounter resetCounter,
    HabitImportanceType importanceType,

    // --- Campos Específicos de Daily ---
    LocalDate startDate,
    DailyRepeatType repeatType,
    Integer repeatEvery,
    List<DailyDaysOfWeek> daysOfWeek,
    DailyRepeatMonthlyOption monthlyOption,

    // --- Campos Específicos de Todo ---
    TodoReminderType reminderType,
    LocalDateTime customReminderAt, // Usado apenas se reminderType for CUSTOM
    Boolean sendEmailReminder
) {

}
