package com.habitparty.adapters.in.web.dtos.response.admin;

import java.util.List;

public record AdminUserDetailDTO(
    AdminUserSummaryDTO summary,
    UserStorageBreakdownDTO storage,
    List<EmailDispatchLogDTO> recentEmailLogs
) {}
