package com.habitparty.adapters.in.web.dtos.response.showcase;

import java.util.UUID;

import com.habitparty.application.usecases.achievement.GetUserShowcaseUseCase.TaskStreakSummary;
import com.habitparty.core.domain.enums.task.TaskType;

public record TaskStreakHighlightDTO(
    UUID id,
    String name,
    TaskType taskType,
    int currentStreak,
    int highestStreak,
    boolean isCycleBased) {

  public static TaskStreakHighlightDTO fromSummary(TaskStreakSummary summary) {
    if (summary == null) {
      return null;
    }
    return new TaskStreakHighlightDTO(
        summary.id(),
        summary.name(),
        summary.taskType(),
        summary.currentStreak(),
        summary.highestStreak(),
        summary.isCycleBased());
  }
}
