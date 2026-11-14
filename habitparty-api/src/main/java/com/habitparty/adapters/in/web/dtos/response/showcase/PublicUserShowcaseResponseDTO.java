package com.habitparty.adapters.in.web.dtos.response.showcase;

import java.util.List;
import java.util.UUID;

import com.habitparty.adapters.in.web.dtos.response.social.SocialUserSummaryDTO;
import com.habitparty.application.usecases.achievement.GetPublicUserShowcaseUseCase;
import com.habitparty.application.usecases.social.SocialRelationshipStatus;

public record PublicUserShowcaseResponseDTO(
    SocialUserSummaryDTO user,
    SocialRelationshipStatus relationshipStatus,
    UUID friendshipId,
    boolean canViewProfile,
    boolean canViewStats,
    boolean canViewAchievements,
    ShowcaseStatsResponseDTO stats,
    List<ProfileHighlightResponseDTO> highlights,
    List<AchievementItemResponseDTO> achievements) {

  public static PublicUserShowcaseResponseDTO fromDomain(
      GetPublicUserShowcaseUseCase.PublicUserShowcaseResult result) {
    var full = result.fullShowcase();
    ShowcaseStatsResponseDTO statsDto = result.canViewStats() && full != null
        ? ShowcaseStatsResponseDTO.fromDomain(
            full.user().getStats(),
            result.effectiveStreak(),
            result.canViewAchievements() ? full.unlockedCount() : 0,
            result.canViewAchievements() ? full.totalAchievements() : 0,
            result.canViewAchievements() ? full.totalAchievementPoints() : 0,
            result.canViewAchievements() ? full.maxPossiblePoints() : 0)
        : null;
    return new PublicUserShowcaseResponseDTO(
        SocialUserSummaryDTO.fromDomain(result.user()),
        result.relationshipStatus(),
        result.friendshipId(),
        result.canViewProfile(),
        result.canViewStats(),
        result.canViewAchievements(),
        statsDto,
        result.highlights().stream().map(ProfileHighlightResponseDTO::fromDomain).toList(),
        result.achievements().stream().map(AchievementItemResponseDTO::fromDomain).toList());
  }
}
