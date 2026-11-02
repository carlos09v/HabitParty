package com.habitparty.application.ports.projections;

import java.util.List;

import com.habitparty.core.domain.entities.EmailDispatchLog;

public record AdminUserDetailProjection(
    AdminUserSummaryProjection summary,
    UserStorageBreakdownProjection storage,
    List<EmailDispatchLog> recentEmailLogs
) {}
