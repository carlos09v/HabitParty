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
    List<AchievementItemResponseDTO> achievements,
    List<ArtifactItemResponseDTO> artifacts) {

  public static PublicUserShowcaseResponseDTO fromDomain(
      GetPublicUserShowcaseUseCase.PublicUserShowcaseResult result) {
    var full = result.fullShowcase();
    boolean isSelf = result.relationshipStatus() == SocialRelationshipStatus.SELF;
    ShowcaseStatsResponseDTO statsDto = result.canViewStats() && full != null
        ? ShowcaseStatsResponseDTO.fromDomain(
            full.user().getStats(),
            result.effectiveStreak(),
            result.canViewAchievements() ? full.unlockedCount() : 0,
            result.canViewAchievements() ? full.totalAchievements() : 0,
            result.canViewAchievements() ? full.totalAchievementPoints() : 0,
            result.canViewAchievements() ? full.maxPossiblePoints() : 0,
            result.canViewAchievements() ? full.unlockedArtifactsCount() : 0,
            result.canViewAchievements() ? full.totalArtifactsCount() : 0,
            full.highestTaskStreak(),
            isSelf ? full.highestTaskStreakTitle() : null,
            isSelf ? full.highestTaskStreakType() : null)
        : null;
    List<ProfileHighlightResponseDTO> highlightDtos = full != null
        ? ProfileHighlightResponseDTO.fromDomainList(result.highlights(), full.resolvedHighlightTaskStreaks())
        : result.highlights().stream().map(ProfileHighlightResponseDTO::fromDomain).toList();
    return new PublicUserShowcaseResponseDTO(
        SocialUserSummaryDTO.fromDomain(result.user()),
        result.relationshipStatus(),
        result.friendshipId(),
        result.canViewProfile(),
        result.canViewStats(),
        result.canViewAchievements(),
        statsDto,
        highlightDtos,
        result.achievements().stream().map(AchievementItemResponseDTO::fromDomain).toList(),
        result.artifacts().stream().map(ArtifactItemResponseDTO::fromDomain).toList());
  }
}
