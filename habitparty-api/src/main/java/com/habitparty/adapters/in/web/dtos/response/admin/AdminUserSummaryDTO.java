package com.habitparty.adapters.in.web.dtos.response.admin;

import java.time.LocalDateTime;
import java.util.UUID;

import com.habitparty.application.ports.projections.AdminUserSummaryProjection;
import com.habitparty.core.domain.enums.SubscriptionStatus;
import com.habitparty.core.domain.enums.UserRole;

public record AdminUserSummaryDTO(
    UUID id,
    String fullName,
    String username,
    String email,
    String profilePhotoUrl,
    UserRole role,
    boolean isPremium,
    boolean isFounder,
    boolean emailVerified,
    LocalDateTime emailVerifiedAt,
    SubscriptionStatus subscriptionStatus,
    LocalDateTime subscriptionEndsAt,
    LocalDateTime createdAt,
    long emailsSentThisMonth,
    long activeEmailReminders,
    long totalTasksCount,
    long activeTasksCount,
    long estimatedStorageBytes,
    String estimatedStorageFormatted
) {
  public static AdminUserSummaryDTO fromProjection(AdminUserSummaryProjection p) {
    return new AdminUserSummaryDTO(
        p.id(),
        p.fullName(),
        p.username(),
        p.email(),
        p.profilePhotoUrl(),
        p.role(),
        p.isPremium(),
        p.isFounder(),
        p.emailVerified(),
        p.emailVerifiedAt(),
        p.subscriptionStatus(),
        p.subscriptionEndsAt(),
        p.createdAt(),
        p.emailsSentThisMonth(),
        p.activeEmailReminders(),
        p.totalTasksCount(),
        p.activeTasksCount(),
        p.estimatedStorageBytes(),
        p.estimatedStorageFormatted()
    );
  }
}
