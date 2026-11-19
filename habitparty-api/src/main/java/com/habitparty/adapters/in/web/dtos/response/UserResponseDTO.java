package com.habitparty.adapters.in.web.dtos.response;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.enums.FriendRequestPolicy;
import com.habitparty.core.domain.enums.PrivacyLevel;
import com.habitparty.core.domain.enums.SubscriptionStatus;
import com.habitparty.core.domain.enums.UserExperienceMode;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserRole;

public record UserResponseDTO(
        UUID id,
        boolean isPremium,
        boolean isFounder,
        boolean emailVerified,
        SubscriptionStatus subscriptionStatus,
        LocalDateTime subscriptionEndsAt,
        boolean hasActiveRecurringSubscription,
        UserRole role,
        String fullName,
        String username,
        UserGender gender,
        UserExperienceMode experienceMode,
        String timezone,
        Instant timezoneUpdatedAt,
        String email,
        String profilePhotoUrl,
        String bio,
        String avatarFrame,
        String equippedTitle,
        String avatarPreset,
        String theme,
        LocalDate birthDate,
        LocalDateTime createdAt,

        // Atributos Derivados (Calculados no Domínio)
        Integer age,
        String currentLevelTitle,
        String nextLevelTitle,
        int xpToNextLevel,

        // Economia e Gamificação
        BigDecimal currentCoins,
        BigDecimal totalGoldEarned,
        int totalXp,
        int currentStreak,
        int highestStreak,
        int achievementPoints,
        String friendCode,
        PrivacyLevel profileVisibility,
        PrivacyLevel statsVisibility,
        PrivacyLevel achievementsVisibility,
        FriendRequestPolicy friendRequestPolicy,
        String usageMode,
        List<String> primaryGoals,
        String mainObstacle,
        Integer dailyFocusGoalMinutes,
        String peakPeriod,
        String disciplineStyle) {
    public static UserResponseDTO fromDomain(User user) {
        return fromDomain(user, user.getCurrentStreak());
    }

    public static UserResponseDTO fromDomain(User user, int effectiveStreak) {
        return new UserResponseDTO(
                user.getId(),
                user.isPremium(),
                user.isFounder(),
                user.isEmailVerified(),
                user.getSubscriptionStatus(),
                user.getSubscriptionEndsAt(),
                user.hasActiveRecurringSubscription(),
                user.getRole(),
                user.getFullName(),
                user.getUsername(),
                user.getGender(),
                user.getExperienceMode(),
                user.getTimezone(),
                user.getTimezoneUpdatedAt(),
                user.getEmail(),
                user.getProfilePhotoUrl().orElse(null),
                user.getBio().orElse(null),
                user.getAvatarFrame(),
                user.getEquippedTitle().orElse(null),
                user.getAvatarPreset().orElse(null),
                user.getEffectiveTheme(),
                user.getBirthDate(),
                user.getCreatedAt(),

                user.getAge(),
                user.getCurrentLevel().getTitle(),
                user.getNextLevel().getTitle(),
                user.getXpToNextLevel(),

                user.getCurrentCoins(),
                user.getTotalGoldEarned(),
                user.getTotalXp(),
                effectiveStreak,
                user.getHighestStreak(),
                user.getStats() != null ? user.getStats().getAchievementPoints() : 0,
                user.getFriendCode(),
                user.getProfileVisibility(),
                user.getStatsVisibility(),
                user.getAchievementsVisibility(),
                user.getFriendRequestPolicy(),
                user.getUsageMode(),
                user.getPrimaryGoals(),
                user.getMainObstacle(),
                user.getDailyFocusGoalMinutes(),
                user.getPeakPeriod(),
                user.getDisciplineStyle());
    }
}
