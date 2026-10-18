package com.habitparty.application.usecases.task;

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

public record CreateTaskCommand(
    String name,
    String description,
    TaskPriority priority,
    List<String> tags,
    TaskDifficulty difficulty,
    TaskType taskType,
    boolean isHardcoreModeEnabled,
    LocalDate dueDate,
    HabitType habitType,
    HabitResetCounter resetCounter,
    HabitImportanceType importanceType,
    LocalDate startDate,
    DailyRepeatType repeatType,
    Integer repeatEvery,
    List<DailyDaysOfWeek> daysOfWeek,
    DailyRepeatMonthlyOption monthlyOption,
    TodoReminderType reminderType,
    LocalDateTime customReminderAt,
    Boolean sendEmailReminder
) {
  public CreateTaskCommand(
      String name, String description, TaskPriority priority, List<String> tags,
      TaskDifficulty difficulty, TaskType taskType, boolean isHardcoreModeEnabled,
      LocalDate dueDate, HabitType habitType, HabitResetCounter resetCounter,
      HabitImportanceType importanceType, LocalDate startDate, DailyRepeatType repeatType,
      Integer repeatEvery, List<DailyDaysOfWeek> daysOfWeek, DailyRepeatMonthlyOption monthlyOption,
      TodoReminderType reminderType, LocalDateTime customReminderAt) {
    this(name, description, priority, tags, difficulty, taskType, isHardcoreModeEnabled,
        dueDate, habitType, resetCounter, importanceType, startDate, repeatType,
        repeatEvery, daysOfWeek, monthlyOption, reminderType, customReminderAt, false);
  }
}
