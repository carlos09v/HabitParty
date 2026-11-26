package com.habitparty.adapters.in.web.dtos.response.social;

import java.time.OffsetDateTime;
import java.util.UUID;

import com.habitparty.application.usecases.social.SocialUserSummary;
import com.habitparty.core.domain.enums.FriendRequestPolicy;
import com.habitparty.core.domain.enums.PrivacyLevel;

public record SocialUserSummaryDTO(
    UUID id,
    String fullName,
    String username,
    String profilePhotoUrl,
    String bio,
    String avatarFrame,
    String equippedTitle,
    String avatarPreset,
    boolean isPremium,
    boolean isFounder,
    boolean emailVerified,
    OffsetDateTime createdAt,
    String levelTitle,
    int totalXp,
    int currentStreak,
    int highestStreak,
    int achievementPoints,
    PrivacyLevel profileVisibility,
    PrivacyLevel statsVisibility,
    PrivacyLevel achievementsVisibility,
    FriendRequestPolicy friendRequestPolicy,
    String friendCode) {

  public static SocialUserSummaryDTO fromDomain(SocialUserSummary summary) {
    if (summary == null) {
      return null;
    }
    return new SocialUserSummaryDTO(
        summary.id(),
        summary.fullName(),
        summary.username(),
        summary.profilePhotoUrl(),
        summary.bio(),
        summary.avatarFrame(),
        summary.equippedTitle(),
        summary.avatarPreset(),
        summary.isPremium(),
        summary.isFounder(),
        summary.emailVerified(),
        summary.createdAt(),
        summary.levelTitle(),
        summary.totalXp(),
        summary.currentStreak(),
        summary.highestStreak(),
        summary.achievementPoints(),
        summary.profileVisibility(),
        summary.statsVisibility(),
        summary.achievementsVisibility(),
        summary.friendRequestPolicy(),
        summary.friendCode());
  }
}
