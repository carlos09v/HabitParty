package com.habitparty.adapters.out.persistence;

import java.util.UUID;

import org.springframework.stereotype.Component;

import com.habitparty.adapters.in.web.dtos.response.admin.UserStorageBreakdownDTO;
import com.habitparty.application.ports.AdminMetricsRepository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;

@Component
public class AdminMetricsAdapter implements AdminMetricsRepository {

  private final EntityManager em;

  public AdminMetricsAdapter(EntityManager em) {
    this.em = em;
  }

  @Override
  public UserStorageBreakdownDTO calculateUserStorageBreakdown(UUID userId) {
    String sql = """
        SELECT
          (SELECT COALESCE(SUM(OCTET_LENGTH(t.name) + COALESCE(OCTET_LENGTH(t.description), 0) + 200), 0) FROM tasks t WHERE t.user_id = :userId),
          (SELECT COUNT(*) FROM tasks t WHERE t.user_id = :userId),
          (SELECT COUNT(*) FROM tasks t WHERE t.user_id = :userId AND t.status = 'PENDING'),
          (SELECT COALESCE(SUM(OCTET_LENGTH(c.name) + 80), 0) FROM checklist_item c WHERE c.user_id = :userId),
          (SELECT COUNT(*) FROM checklist_item c WHERE c.user_id = :userId),
          (SELECT COALESCE(SUM(OCTET_LENGTH(w.name) + 120), 0) FROM workspaces w WHERE w.user_id = :userId),
          (SELECT COUNT(*) FROM workspaces w WHERE w.user_id = :userId),
          (SELECT COALESCE(SUM(OCTET_LENGTH(h.name_snapshot) + 150), 0) FROM transaction_history h WHERE h.user_id = :userId),
          (SELECT COUNT(*) FROM transaction_history h WHERE h.user_id = :userId),
          (SELECT COALESCE(SUM(OCTET_LENGTH(i.name_snapshot) + 100), 0) FROM inventory_items i WHERE i.user_id = :userId),
          (SELECT COUNT(*) FROM inventory_items i WHERE i.user_id = :userId),
          (SELECT COALESCE(COUNT(*) * 120, 0) FROM focus_records f WHERE f.user_id = :userId),
          (SELECT COUNT(*) FROM focus_records f WHERE f.user_id = :userId),
          (SELECT COALESCE(OCTET_LENGTH(u.full_name) + OCTET_LENGTH(u.email) + OCTET_LENGTH(u.username) + 250, 0) FROM users u WHERE u.user_id = :userId)
    """;

    Query query = em.createNativeQuery(sql);
    query.setParameter("userId", userId);

    Object[] row = (Object[]) query.getSingleResult();

    long tasksBytes = ((Number) row[0]).longValue();
    long tasksCount = ((Number) row[1]).longValue();
    long activeTasksCount = ((Number) row[2]).longValue();

    long checklistsBytes = ((Number) row[3]).longValue();
    long checklistsCount = ((Number) row[4]).longValue();

    long workspacesBytes = ((Number) row[5]).longValue();
    long workspacesCount = ((Number) row[6]).longValue();

    long historyBytes = ((Number) row[7]).longValue();
    long historyCount = ((Number) row[8]).longValue();

    long inventoryBytes = ((Number) row[9]).longValue();
    long inventoryCount = ((Number) row[10]).longValue();

    long focusBytes = ((Number) row[11]).longValue();
    long focusCount = ((Number) row[12]).longValue();

    long userRowBytes = ((Number) row[13]).longValue();

    long totalBytes = tasksBytes + checklistsBytes + workspacesBytes + historyBytes + inventoryBytes + focusBytes + userRowBytes;

    return new UserStorageBreakdownDTO(
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
        UserStorageBreakdownDTO.formatBytes(totalBytes)
    );
  }

  @Override
  public long calculateTotalDatabaseStorageBytes() {
    String sql = """
        SELECT
          (SELECT COALESCE(SUM(OCTET_LENGTH(u.full_name) + OCTET_LENGTH(u.email) + OCTET_LENGTH(u.username) + 250), 0) FROM users u) +
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
