package com.habitparty.adapters.in.web.dtos.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import com.habitparty.core.domain.entities.User;
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
        String email,
        String profilePhotoUrl,
        String bio,
        String avatarFrame,
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
        int achievementPoints) {
    public static UserResponseDTO fromDomain(User user) {
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
                user.getEmail(),
                user.getProfilePhotoUrl().orElse(null),
                user.getBio().orElse(null),
                user.getAvatarFrame(),
                user.getBirthDate(),
                user.getCreatedAt(),

                user.getAge(),
                user.getCurrentLevel().getTitle(),
                user.getNextLevel().getTitle(),
                user.getXpToNextLevel(),

                user.getCurrentCoins(),
                user.getTotalGoldEarned(),
                user.getTotalXp(),
                user.getCurrentStreak(),
                user.getHighestStreak(),
                user.getStats() != null ? user.getStats().getAchievementPoints() : 0);
    }
}
