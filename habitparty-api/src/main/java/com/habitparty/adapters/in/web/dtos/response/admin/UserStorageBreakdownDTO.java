package com.habitparty.adapters.in.web.dtos.response.admin;

import com.habitparty.application.ports.projections.UserStorageBreakdownProjection;

public record UserStorageBreakdownDTO(
    long tasksBytes,
    long tasksCount,
    long activeTasksCount,
    long checklistsBytes,
    long checklistsCount,
    long workspacesBytes,
    long workspacesCount,
    long historyBytes,
    long historyCount,
    long inventoryBytes,
    long inventoryCount,
    long focusBytes,
    long focusCount,
    long userRowBytes,
    long totalBytes,
    String totalFormatted
) {
  public static String formatBytes(long bytes) {
    return UserStorageBreakdownProjection.formatBytes(bytes);
  }

  public static UserStorageBreakdownDTO fromProjection(UserStorageBreakdownProjection p) {
    return new UserStorageBreakdownDTO(
        p.tasksBytes(),
        p.tasksCount(),
        p.activeTasksCount(),
        p.checklistsBytes(),
        p.checklistsCount(),
        p.workspacesBytes(),
        p.workspacesCount(),
        p.historyBytes(),
        p.historyCount(),
        p.inventoryBytes(),
        p.inventoryCount(),
        p.focusBytes(),
        p.focusCount(),
        p.userRowBytes(),
        p.totalBytes(),
        p.totalFormatted()
    );
  }
}
