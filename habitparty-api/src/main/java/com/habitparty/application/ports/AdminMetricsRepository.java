package com.habitparty.application.ports;

import java.util.UUID;

import com.habitparty.adapters.in.web.dtos.response.admin.UserStorageBreakdownDTO;

public interface AdminMetricsRepository {
  UserStorageBreakdownDTO calculateUserStorageBreakdown(UUID userId);

  long calculateTotalDatabaseStorageBytes();

  long countTotalTasks();

  long countTotalActiveTasks();
}
