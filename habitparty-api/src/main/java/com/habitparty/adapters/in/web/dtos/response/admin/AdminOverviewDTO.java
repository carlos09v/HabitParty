package com.habitparty.adapters.in.web.dtos.response.admin;

public record AdminOverviewDTO(
    long totalUsers,
    long freeUsers,
    long premiumUsers,
    long founderUsers,
    long adminUsers,
    long emailsSentThisMonth,
    long resendMonthlyQuota,
    double resendQuotaPercentage,
    long totalTasksCount,
    long totalActiveTasksCount,
    long estimatedDatabaseSizeBytes,
    String estimatedDatabaseSizeFormatted
) {}
