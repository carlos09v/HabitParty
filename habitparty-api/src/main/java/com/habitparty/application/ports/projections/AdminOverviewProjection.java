package com.habitparty.application.ports.projections;

import java.time.LocalDate;

public record AdminOverviewProjection(
    long totalUsers,
    long freeUsers,
    long premiumUsers,
    long founderUsers,
    long adminUsers,
    long verifiedUsers,
    long emailsSentThisMonth,
    long resendMonthlyQuota,
    double resendQuotaPercentage,
    LocalDate resendQuotaResetDate,
    long totalTasksCount,
    long totalActiveTasksCount,
    long estimatedDatabaseSizeBytes,
    String estimatedDatabaseSizeFormatted
) {}
