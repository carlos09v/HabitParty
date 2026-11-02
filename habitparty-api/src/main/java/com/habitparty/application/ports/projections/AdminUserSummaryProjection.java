package com.habitparty.application.ports.projections;

import java.time.LocalDateTime;
import java.util.UUID;

import com.habitparty.core.domain.enums.SubscriptionStatus;
import com.habitparty.core.domain.enums.UserRole;

public record AdminUserSummaryProjection(
    UUID id,
    String fullName,
    String username,
    String email,
    String profilePhotoUrl,
    UserRole role,
    boolean isPremium,
    boolean isFounder,
    SubscriptionStatus subscriptionStatus,
    LocalDateTime createdAt,
    long emailsSentThisMonth,
    long activeEmailReminders,
    long totalTasksCount,
    long activeTasksCount,
    long estimatedStorageBytes,
    String estimatedStorageFormatted
) {}
