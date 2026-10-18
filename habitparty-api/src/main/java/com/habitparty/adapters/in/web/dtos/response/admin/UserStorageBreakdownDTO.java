package com.habitparty.adapters.in.web.dtos.response.admin;

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
    if (bytes < 1024) return bytes + " B";
    int exp = (int) (Math.log(bytes) / Math.log(1024));
    char unit = "KMGTPE".charAt(exp - 1);
    return String.format(java.util.Locale.US, "%.1f %cB", bytes / Math.pow(1024, exp), unit);
  }
}
