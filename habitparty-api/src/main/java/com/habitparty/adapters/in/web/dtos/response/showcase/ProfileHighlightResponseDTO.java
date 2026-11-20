package com.habitparty.adapters.in.web.dtos.response.showcase;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.habitparty.application.usecases.achievement.GetUserShowcaseUseCase.TaskStreakSummary;
import com.habitparty.core.domain.entities.achievement.ProfileHighlight;
import com.habitparty.core.domain.enums.HighlightType;

public record ProfileHighlightResponseDTO(
    UUID id,
    int displayOrder,
    HighlightType highlightType,
    UUID referenceId,
    String highlightKey,
    @JsonInclude(JsonInclude.Include.NON_NULL) TaskStreakHighlightDTO taskStreak) {

  public static ProfileHighlightResponseDTO fromDomain(ProfileHighlight highlight) {
    return fromDomain(highlight, null);
  }

  public static ProfileHighlightResponseDTO fromDomain(
      ProfileHighlight highlight,
      TaskStreakHighlightDTO taskStreak) {
    return new ProfileHighlightResponseDTO(
        highlight.getId(),
        highlight.getDisplayOrder(),
        highlight.getHighlightType(),
        highlight.getReferenceId().orElse(null),
        highlight.getHighlightKey().orElse(null),
        taskStreak);
  }

  public static List<ProfileHighlightResponseDTO> fromDomainList(
      List<ProfileHighlight> highlights,
      List<TaskStreakSummary> taskStreaks) {
    if (highlights == null || highlights.isEmpty()) {
      return List.of();
    }
    Map<String, TaskStreakSummary> byTaskId = taskStreaks == null || taskStreaks.isEmpty()
        ? Map.of()
        : taskStreaks.stream()
            .collect(Collectors.toMap(s -> s.id().toString(), Function.identity(), (a, b) -> a));
    return highlights.stream()
        .map(h -> {
          TaskStreakHighlightDTO taskStreakDto = h.getHighlightType() == HighlightType.TASK_STREAK
              ? h.getHighlightKey().map(byTaskId::get).map(TaskStreakHighlightDTO::fromSummary).orElse(null)
              : null;
          return fromDomain(h, taskStreakDto);
        })
        .toList();
  }
}
