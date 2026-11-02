package com.habitparty.adapters.in.web.dtos.response.admin;

import java.time.LocalDate;

import com.habitparty.application.ports.projections.AdminOverviewProjection;

public record AdminOverviewDTO(
    long totalUsers,
    long freeUsers,
    long premiumUsers,
    long founderUsers,
    long adminUsers,
    long emailsSentThisMonth,
    long resendMonthlyQuota,
    double resendQuotaPercentage,
    LocalDate resendQuotaResetDate,
    long totalTasksCount,
    long totalActiveTasksCount,
    long estimatedDatabaseSizeBytes,
    String estimatedDatabaseSizeFormatted
) {
  public static AdminOverviewDTO fromProjection(AdminOverviewProjection p) {
    return new AdminOverviewDTO(
        p.totalUsers(),
        p.freeUsers(),
        p.premiumUsers(),
        p.founderUsers(),
        p.adminUsers(),
        p.emailsSentThisMonth(),
        p.resendMonthlyQuota(),
        p.resendQuotaPercentage(),
        p.resendQuotaResetDate(),
        p.totalTasksCount(),
        p.totalActiveTasksCount(),
        p.estimatedDatabaseSizeBytes(),
        p.estimatedDatabaseSizeFormatted()
    );
  }
}
