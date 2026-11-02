package com.habitparty.adapters.out.persistence;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.habitparty.application.ports.AdminMetricsRepository;
import com.habitparty.application.ports.projections.UserStorageBreakdownProjection;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;

@Component
public class AdminMetricsAdapter implements AdminMetricsRepository {

  private final EntityManager em;

  public AdminMetricsAdapter(EntityManager em) {
    this.em = em;
  }

  @Override
  public UserStorageBreakdownProjection calculateUserStorageBreakdown(UUID userId) {
    if (userId == null) {
      return UserStorageBreakdownProjection.empty();
    }
    return calculateUsersStorageBreakdown(List.of(userId))
        .getOrDefault(userId, UserStorageBreakdownProjection.empty());
  }

  @Override
  @SuppressWarnings("unchecked")
  public Map<UUID, UserStorageBreakdownProjection> calculateUsersStorageBreakdown(Collection<UUID> userIds) {
    if (userIds == null || userIds.isEmpty()) {
      return Map.of();
    }

    String sql = """
        SELECT
          u.user_id,
          COALESCE(t.tasks_bytes, 0),
          COALESCE(t.tasks_count, 0),
          COALESCE(t.active_tasks_count, 0),
          COALESCE(c.checklists_bytes, 0),
          COALESCE(c.checklists_count, 0),
          COALESCE(w.workspaces_bytes, 0),
          COALESCE(w.workspaces_count, 0),
          COALESCE(h.history_bytes, 0),
          COALESCE(h.history_count, 0),
          COALESCE(i.inventory_bytes, 0),
          COALESCE(i.inventory_count, 0),
          COALESCE(f.focus_bytes, 0),
          COALESCE(f.focus_count, 0),
          COALESCE(OCTET_LENGTH(u.full_name) + OCTET_LENGTH(u.email) + OCTET_LENGTH(u.username) + 410, 0)
        FROM users u
        LEFT JOIN (
          SELECT user_id,
                 SUM(OCTET_LENGTH(name) + COALESCE(OCTET_LENGTH(description), 0) + 200) AS tasks_bytes,
                 COUNT(*) AS tasks_count,
                 SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS active_tasks_count
          FROM tasks WHERE user_id IN (:userIds) GROUP BY user_id
        ) t ON t.user_id = u.user_id
        LEFT JOIN (
          SELECT user_id,
                 SUM(OCTET_LENGTH(name) + 80) AS checklists_bytes,
                 COUNT(*) AS checklists_count
          FROM checklist_item WHERE user_id IN (:userIds) GROUP BY user_id
        ) c ON c.user_id = u.user_id
        LEFT JOIN (
          SELECT user_id,
                 SUM(OCTET_LENGTH(name) + 120) AS workspaces_bytes,
                 COUNT(*) AS workspaces_count
          FROM workspaces WHERE user_id IN (:userIds) GROUP BY user_id
        ) w ON w.user_id = u.user_id
        LEFT JOIN (
          SELECT user_id,
                 SUM(OCTET_LENGTH(name_snapshot) + 150) AS history_bytes,
                 COUNT(*) AS history_count
          FROM transaction_history WHERE user_id IN (:userIds) GROUP BY user_id
        ) h ON h.user_id = u.user_id
        LEFT JOIN (
          SELECT user_id,
                 SUM(OCTET_LENGTH(name_snapshot) + 100) AS inventory_bytes,
                 COUNT(*) AS inventory_count
          FROM inventory_items WHERE user_id IN (:userIds) GROUP BY user_id
        ) i ON i.user_id = u.user_id
        LEFT JOIN (
          SELECT user_id,
                 COUNT(*) * 120 AS focus_bytes,
                 COUNT(*) AS focus_count
          FROM focus_records WHERE user_id IN (:userIds) GROUP BY user_id
        ) f ON f.user_id = u.user_id
        WHERE u.user_id IN (:userIds)
    """;

    Query query = em.createNativeQuery(sql);
    query.setParameter("userIds", userIds);

    List<Object[]> rows = query.getResultList();
    Map<UUID, UserStorageBreakdownProjection> result = new HashMap<>(rows.size());

    for (Object[] row : rows) {
      UUID uid = row[0] instanceof UUID u ? u : UUID.fromString(row[0].toString());
      long tasksBytes = toLong(row[1]);
      long tasksCount = toLong(row[2]);
      long activeTasksCount = toLong(row[3]);
      long checklistsBytes = toLong(row[4]);
      long checklistsCount = toLong(row[5]);
      long workspacesBytes = toLong(row[6]);
      long workspacesCount = toLong(row[7]);
      long historyBytes = toLong(row[8]);
      long historyCount = toLong(row[9]);
      long inventoryBytes = toLong(row[10]);
      long inventoryCount = toLong(row[11]);
      long focusBytes = toLong(row[12]);
      long focusCount = toLong(row[13]);
      long userRowBytes = toLong(row[14]);

      long totalBytes = tasksBytes + checklistsBytes + workspacesBytes + historyBytes
          + inventoryBytes + focusBytes + userRowBytes;

      result.put(uid, new UserStorageBreakdownProjection(
          tasksBytes,
          tasksCount,
          activeTasksCount,
          checklistsBytes,
          checklistsCount,
          workspacesBytes,
          workspacesCount,
          historyBytes,
          historyCount,
          inventoryBytes,
          inventoryCount,
          focusBytes,
          focusCount,
          userRowBytes,
          totalBytes,
          UserStorageBreakdownProjection.formatBytes(totalBytes)
      ));
    }

    return result;
  }

  private static long toLong(Object val) {
    return val instanceof Number n ? n.longValue() : 0L;
  }

  @Override
  public long calculateTotalDatabaseStorageBytes() {
    String sql = """
        SELECT
          (SELECT COALESCE(SUM(OCTET_LENGTH(u.full_name) + OCTET_LENGTH(u.email) + OCTET_LENGTH(u.username) + 410), 0) FROM users u) +
          (SELECT COALESCE(SUM(OCTET_LENGTH(t.name) + COALESCE(OCTET_LENGTH(t.description), 0) + 200), 0) FROM tasks t) +
          (SELECT COALESCE(SUM(OCTET_LENGTH(c.name) + 80), 0) FROM checklist_item c) +
          (SELECT COALESCE(SUM(OCTET_LENGTH(w.name) + 120), 0) FROM workspaces w) +
          (SELECT COALESCE(SUM(OCTET_LENGTH(h.name_snapshot) + 150), 0) FROM transaction_history h) +
          (SELECT COALESCE(COUNT(*) * 120, 0) FROM focus_records f) +
          (SELECT COALESCE(COUNT(*) * 100, 0) FROM inventory_items i)
    """;
    Query query = em.createNativeQuery(sql);
    Number result = (Number) query.getSingleResult();
    return result != null ? result.longValue() : 0L;
  }

  @Override
  public long countTotalTasks() {
    Query query = em.createNativeQuery("SELECT COUNT(*) FROM tasks");
    Number result = (Number) query.getSingleResult();
    return result != null ? result.longValue() : 0L;
  }

  @Override
  public long countTotalActiveTasks() {
    Query query = em.createNativeQuery("SELECT COUNT(*) FROM tasks WHERE status = 'PENDING'");
    Number result = (Number) query.getSingleResult();
    return result != null ? result.longValue() : 0L;
  }
}
