package com.habitparty.application.usecases.social;

import java.util.UUID;

import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.enums.FriendRequestPolicy;
import com.habitparty.core.domain.enums.PrivacyLevel;

/**
 * Projeção sanitizada de usuário para o módulo social e vitrine pública (sem email/data nascimento/PII).
 */
public record SocialUserSummary(
    UUID id,
    String fullName,
    String username,
    String profilePhotoUrl,
    String bio,
    String avatarFrame,
    boolean isPremium,
    boolean isFounder,
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

  public static SocialUserSummary fromUserForViewer(
      User user,
      int effectiveStreak,
      SocialRelationshipStatus status) {
    boolean isSelf = status == SocialRelationshipStatus.SELF;
    boolean isFriend = status == SocialRelationshipStatus.FRIENDS;
    boolean canViewProfile = isAllowed(user.getProfileVisibility(), isSelf, isFriend);
    boolean canViewStats = canViewProfile && isAllowed(user.getStatsVisibility(), isSelf, isFriend);
    boolean canViewAchievements = canViewProfile && isAllowed(user.getAchievementsVisibility(), isSelf, isFriend);
    boolean includeFriendCode = isSelf || isFriend;
    boolean maskStats = !canViewStats;

    int achPoints = user.getStats() != null ? user.getStats().getAchievementPoints() : 0;
    return new SocialUserSummary(
        user.getId(),
        user.getFullName(),
        user.getUsername(),
        user.getProfilePhotoUrl().orElse(null),
        canViewProfile ? user.getBio().orElse(null) : null,
        user.getAvatarFrame(),
        user.isPremium(),
        user.isFounder(),
        user.getCurrentLevel().getTitle(),
        maskStats ? 0 : user.getTotalXp(),
        maskStats ? 0 : Math.max(0, effectiveStreak),
        maskStats ? 0 : user.getHighestStreak(),
        (maskStats || !canViewAchievements) ? 0 : achPoints,
        user.getProfileVisibility(),
        user.getStatsVisibility(),
        user.getAchievementsVisibility(),
        user.getFriendRequestPolicy(),
        includeFriendCode ? user.getFriendCode() : null);
  }

  public static boolean isAllowed(
      PrivacyLevel level,
      boolean isSelf,
      boolean isFriend) {
    if (isSelf) {
      return true;
    }
    PrivacyLevel resolved = level != null ? level : PrivacyLevel.PUBLIC;
    return switch (resolved) {
      case PUBLIC -> true;
      case FRIENDS_ONLY -> isFriend;
      case PRIVATE -> false;
    };
  }
}
