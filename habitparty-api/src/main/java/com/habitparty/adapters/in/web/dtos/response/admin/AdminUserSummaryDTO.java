package com.habitparty.adapters.in.web.dtos.response.admin;

import java.time.OffsetDateTime;
import java.util.UUID;

import com.habitparty.application.ports.projections.AdminUserSummaryProjection;
import com.habitparty.application.usecases.common.UtcDateTimeMapper;
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
    OffsetDateTime emailVerifiedAt,
    SubscriptionStatus subscriptionStatus,
    OffsetDateTime subscriptionEndsAt,
    OffsetDateTime createdAt,
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
        UtcDateTimeMapper.toUtcOffsetDateTime(p.emailVerifiedAt()),
        p.subscriptionStatus(),
        UtcDateTimeMapper.toUtcOffsetDateTime(p.subscriptionEndsAt()),
        UtcDateTimeMapper.toUtcOffsetDateTime(p.createdAt()),
        p.emailsSentThisMonth(),
        p.activeEmailReminders(),
        p.totalTasksCount(),
        p.activeTasksCount(),
        p.estimatedStorageBytes(),
        p.estimatedStorageFormatted()
    );
  }
}
