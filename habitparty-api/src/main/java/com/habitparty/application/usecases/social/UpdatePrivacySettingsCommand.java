package com.habitparty.application.usecases.social;

import com.habitparty.core.domain.enums.FriendRequestPolicy;
import com.habitparty.core.domain.enums.PrivacyLevel;

public record UpdatePrivacySettingsCommand(
    PrivacyLevel profileVisibility,
    PrivacyLevel statsVisibility,
    PrivacyLevel achievementsVisibility,
    FriendRequestPolicy friendRequestPolicy) {
}
