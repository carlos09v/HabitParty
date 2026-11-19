package com.habitparty.adapters.in.web.dtos.response.showcase;

import java.util.List;

import com.habitparty.adapters.in.web.dtos.response.UserResponseDTO;
import com.habitparty.application.usecases.achievement.GetUserShowcaseUseCase.UserShowcaseResult;

public record UserShowcaseResponseDTO(
    UserResponseDTO user,
    ShowcaseStatsResponseDTO stats,
    List<ProfileHighlightResponseDTO> highlights,
    List<AchievementItemResponseDTO> achievements,
    List<ArtifactItemResponseDTO> artifacts) {

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
            result.totalArtifactsCount()),
        result.highlights().stream().map(ProfileHighlightResponseDTO::fromDomain).toList(),
        result.achievements().stream().map(AchievementItemResponseDTO::fromDomain).toList(),
        result.artifacts().stream().map(ArtifactItemResponseDTO::fromDomain).toList());
  }
}
