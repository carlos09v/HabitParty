package com.habitparty.application.ports;

import java.util.Collection;
import java.util.Map;
import java.util.UUID;

import com.habitparty.application.ports.projections.UserStorageBreakdownProjection;

public interface AdminMetricsRepository {
  UserStorageBreakdownProjection calculateUserStorageBreakdown(UUID userId);

  Map<UUID, UserStorageBreakdownProjection> calculateUsersStorageBreakdown(Collection<UUID> userIds);

  long calculateTotalDatabaseStorageBytes();

  long countTotalTasks();

  long countTotalActiveTasks();
}
