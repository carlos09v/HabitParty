package com.habitparty.core.domain.entities.user;

import com.habitparty.core.domain.enums.FriendRequestPolicy;
import com.habitparty.core.domain.enums.PrivacyLevel;

/**
 * Value Object imutável com as configurações sociais e de privacidade do usuário.
 */
public record PrivacySettings(
    PrivacyLevel profileVisibility,
    PrivacyLevel statsVisibility,
    PrivacyLevel achievementsVisibility,
    FriendRequestPolicy friendRequestPolicy) {

  public static final PrivacySettings DEFAULT = new PrivacySettings(
      PrivacyLevel.PUBLIC,
      PrivacyLevel.PUBLIC,
      PrivacyLevel.PUBLIC,
      FriendRequestPolicy.EVERYONE);

  public PrivacySettings {
    profileVisibility = profileVisibility != null ? profileVisibility : PrivacyLevel.PUBLIC;
    statsVisibility = statsVisibility != null ? statsVisibility : PrivacyLevel.PUBLIC;
    achievementsVisibility = achievementsVisibility != null ? achievementsVisibility : PrivacyLevel.PUBLIC;
    friendRequestPolicy = friendRequestPolicy != null ? friendRequestPolicy : FriendRequestPolicy.EVERYONE;
  }

  public PrivacySettings update(
      PrivacyLevel newProfileVisibility,
      PrivacyLevel newStatsVisibility,
      PrivacyLevel newAchievementsVisibility,
      FriendRequestPolicy newFriendRequestPolicy) {
    return new PrivacySettings(
        newProfileVisibility != null ? newProfileVisibility : this.profileVisibility,
        newStatsVisibility != null ? newStatsVisibility : this.statsVisibility,
        newAchievementsVisibility != null ? newAchievementsVisibility : this.achievementsVisibility,
        newFriendRequestPolicy != null ? newFriendRequestPolicy : this.friendRequestPolicy);
  }

  public PrivacySettings withProfileVisibility(PrivacyLevel value) {
    return new PrivacySettings(value, statsVisibility, achievementsVisibility, friendRequestPolicy);
  }

  public PrivacySettings withStatsVisibility(PrivacyLevel value) {
    return new PrivacySettings(profileVisibility, value, achievementsVisibility, friendRequestPolicy);
  }

  public PrivacySettings withAchievementsVisibility(PrivacyLevel value) {
    return new PrivacySettings(profileVisibility, statsVisibility, value, friendRequestPolicy);
  }

  public PrivacySettings withFriendRequestPolicy(FriendRequestPolicy value) {
    return new PrivacySettings(profileVisibility, statsVisibility, achievementsVisibility, value);
  }
}
