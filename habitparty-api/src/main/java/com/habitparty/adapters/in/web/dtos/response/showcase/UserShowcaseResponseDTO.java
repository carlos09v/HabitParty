package com.habitparty.adapters.in.web.dtos.response.showcase;

import java.util.List;

import com.habitparty.adapters.in.web.dtos.response.UserResponseDTO;
import com.habitparty.application.usecases.achievement.GetUserShowcaseUseCase.UserShowcaseResult;

public record UserShowcaseResponseDTO(
    UserResponseDTO user,
    ShowcaseStatsResponseDTO stats,
    List<ProfileHighlightResponseDTO> highlights,
    List<AchievementItemResponseDTO> achievements,
    List<ArtifactItemResponseDTO> artifacts,
    List<TaskStreakHighlightDTO> taskStreaks) {

  public UserShowcaseResponseDTO(
      UserResponseDTO user,
      ShowcaseStatsResponseDTO stats,
      List<ProfileHighlightResponseDTO> highlights,
      List<AchievementItemResponseDTO> achievements,
      List<ArtifactItemResponseDTO> artifacts) {
    this(user, stats, highlights, achievements, artifacts, List.of());
  }

  public static UserShowcaseResponseDTO fromDomain(UserShowcaseResult result) {
    return new UserShowcaseResponseDTO(
        UserResponseDTO.fromDomain(result.user(), result.effectiveStreak()),
        ShowcaseStatsResponseDTO.fromDomain(
            result.user().getStats(),
            result.effectiveStreak(),
            result.unlockedCount(),
            result.totalAchievements(),
            result.totalAchievementPoints(),
            result.maxPossiblePoints(),
            result.unlockedArtifactsCount(),
            result.totalArtifactsCount(),
            result.highestTaskStreak(),
            result.highestTaskStreakTitle(),
            result.highestTaskStreakType()),
        ProfileHighlightResponseDTO.fromDomainList(result.highlights(), result.resolvedHighlightTaskStreaks()),
        result.achievements().stream().map(AchievementItemResponseDTO::fromDomain).toList(),
        result.artifacts().stream().map(ArtifactItemResponseDTO::fromDomain).toList(),
        result.taskStreaks().stream().map(TaskStreakHighlightDTO::fromSummary).toList());
  }
}
