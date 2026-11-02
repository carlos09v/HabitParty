package com.habitparty.adapters.in.web.dtos.response.admin;

import java.util.List;

import com.habitparty.application.ports.projections.AdminUserDetailProjection;

public record AdminUserDetailDTO(
    AdminUserSummaryDTO summary,
    UserStorageBreakdownDTO storage,
    List<EmailDispatchLogDTO> recentEmailLogs
) {
  public static AdminUserDetailDTO fromProjection(AdminUserDetailProjection p) {
    return new AdminUserDetailDTO(
        AdminUserSummaryDTO.fromProjection(p.summary()),
        UserStorageBreakdownDTO.fromProjection(p.storage()),
        p.recentEmailLogs().stream().map(EmailDispatchLogDTO::fromDomain).toList()
    );
  }
}
