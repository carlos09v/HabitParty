package com.habitparty.adapters.in.web.dtos.response.showcase;

import java.util.List;

import com.habitparty.adapters.in.web.dtos.response.UserResponseDTO;
import com.habitparty.application.usecases.achievement.GetUserShowcaseUseCase.UserShowcaseResult;

public record UserShowcaseResponseDTO(
    UserResponseDTO user,
    ShowcaseStatsResponseDTO stats,
    List<ProfileHighlightResponseDTO> highlights,
    List<AchievementItemResponseDTO> achievements) {

  public static UserShowcaseResponseDTO fromDomain(UserShowcaseResult result) {
    return new UserShowcaseResponseDTO(
        UserResponseDTO.fromDomain(result.user()),
        ShowcaseStatsResponseDTO.fromDomain(
            result.user().getStats(),
            result.unlockedCount(),
            result.totalAchievements(),
            result.totalAchievementPoints(),
            result.maxPossiblePoints()),
        result.highlights().stream().map(ProfileHighlightResponseDTO::fromDomain).toList(),
        result.achievements().stream().map(AchievementItemResponseDTO::fromDomain).toList());
  }
}
