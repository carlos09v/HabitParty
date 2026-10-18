package com.habitparty.adapters.in.web.dtos.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.enums.SubscriptionStatus;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserRole;

public record UserResponseDTO(
        UUID id,
        boolean isPremium,
        boolean isFounder,
        SubscriptionStatus subscriptionStatus,
        LocalDateTime subscriptionEndsAt,
        boolean hasActiveRecurringSubscription,
        UserRole role,
        String fullName,
        String username,
        UserGender gender,
        String email,
        String profilePhotoUrl,
        LocalDate birthday,

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
        int highestStreak) {
    public static UserResponseDTO fromDomain(User user) {
        // Obs: dados sensíveis são omitidos (como a password)
        return new UserResponseDTO(
                user.getId(),
                user.isPremium(),
                user.isFounder(),
                user.getSubscriptionStatus(),
                user.getSubscriptionEndsAt(),
                user.hasActiveRecurringSubscription(),
                user.getRole(),
                user.getFullName(),
                user.getUsername(),
                user.getGender(),
                user.getEmail(),
                user.getProfilePhotoUrl().orElse(null), // Se você usou Optional no getter
                user.getBirthday(),

                user.getAge(), // A mágica da Idade!
                user.getCurrentLevel().getTitle(), // A mágica do Nível!
                user.getNextLevel().getTitle(),
                user.getXpToNextLevel(),

                user.getCurrentCoins(),
                user.getTotalGoldEarned(),
                user.getTotalXp(),
                user.getCurrentStreak(),
                user.getHighestStreak());
    }
}
