package com.habitparty.adapters.in.web.dtos.response;

import java.math.BigDecimal;
import java.util.UUID;

import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.enums.UserRole;

public record UserResponseDTO(
        UUID id,
        boolean isPremium,
        UserRole role,
        String fullName,
        String username,
        String email,
        String profilePhotoUrl,

        // Atributos Derivados (Calculados no Domínio)
        int age,
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
                user.getRole(),
                user.getFullName(),
                user.getUsername(),
                user.getEmail(),
                user.getProfilePhotoUrl().orElse(null), // Se você usou Optional no getter

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
