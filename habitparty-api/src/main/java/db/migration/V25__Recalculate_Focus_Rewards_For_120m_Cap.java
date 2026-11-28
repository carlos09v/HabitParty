package db.migration;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;

import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.focus.FocusRecord;
import com.habitparty.core.domain.entities.focus.FocusRewardRecalculationPlanner;
import com.habitparty.core.domain.entities.focus.FocusRewardRecalculationPlanner.RecordAdjustment;
import com.habitparty.core.domain.entities.focus.FocusRewardRecalculationPlanner.UserRecalculationPlan;
import com.habitparty.core.domain.enums.FocusRecordType;

/**
 * Migration V25:
 * Recalcula sessões produtivas históricas de foco após a ampliação do teto por sessão
 * de 90 min (1h30) para 120 min (2h), aplicando exclusivamente deltas positivos em
 * focus_records, transaction_history (FOCUS_COMPLETED) e user_stats, respeitando
 * registros com reward_locked = true.
 */
public class V25__Recalculate_Focus_Rewards_For_120m_Cap extends BaseJavaMigration {

  private record UserZoneRow(UUID userId, ZoneId zoneId) {}

  @Override
  public void migrate(Context context) throws Exception {
    Connection conn = context.getConnection();
    if (!hasRequiredTables(conn)) {
      return;
    }

    recalculatePositiveFocusRewards(conn);
  }

  private boolean hasRequiredTables(Connection conn) throws SQLException {
    return tableExists(conn, "users")
        && tableExists(conn, "user_stats")
        && tableExists(conn, "focus_records")
        && tableExists(conn, "transaction_history");
  }

  private boolean tableExists(Connection conn, String tableName) throws SQLException {
    var meta = conn.getMetaData();
    try (ResultSet rs = meta.getTables(null, null, tableName, new String[] {"TABLE"})) {
      if (rs.next()) {
        return true;
      }
    }
    try (ResultSet rs = meta.getTables(null, null, tableName.toUpperCase(Locale.ROOT), new String[] {"TABLE"})) {
      return rs.next();
    }
  }

  private boolean columnExists(Connection conn, String tableName, String columnName) throws SQLException {
    var meta = conn.getMetaData();
    try (ResultSet rs = meta.getColumns(null, null, tableName, columnName)) {
      if (rs.next()) {
        return true;
      }
    }
    try (ResultSet rs = meta.getColumns(
        null, null, tableName.toUpperCase(Locale.ROOT), columnName.toUpperCase(Locale.ROOT))) {
      return rs.next();
    }
  }

  private void recalculatePositiveFocusRewards(Connection conn) throws SQLException {
    List<UserZoneRow> users = loadUsersWithStats(conn);
    if (users.isEmpty()) {
      return;
    }

    boolean hasRewardLocked = columnExists(conn, "focus_records", "reward_locked");
    boolean hasStatsVersion = columnExists(conn, "user_stats", "version");
    Map<UUID, List<FocusRecord>> recordsByUserId = loadProductiveFocusRecordsByUser(conn, hasRewardLocked);
    ZoneId storageZone = ZoneId.systemDefault();

    String updateFocusSql = """
        UPDATE focus_records
        SET xp_earned = ?, coins_earned = ?
        WHERE focus_record_id = ?
        """;
    String updateTxSql = """
        UPDATE transaction_history
        SET xp_amount = ?, gold_amount = ?
        WHERE reference_id = ?
          AND user_id = ?
          AND transaction_type = 'FOCUS_COMPLETED'
        """;
    String updateStatsSql = hasStatsVersion
        ? """
            UPDATE user_stats
            SET total_xp = total_xp + ?,
                current_coins = current_coins + ?,
                total_gold_earned = total_gold_earned + ?,
                updated_at = ?,
                version = version + 1
            WHERE user_id = ?
            """
        : """
            UPDATE user_stats
            SET total_xp = total_xp + ?,
                current_coins = current_coins + ?,
                total_gold_earned = total_gold_earned + ?,
                updated_at = ?
            WHERE user_id = ?
            """;

    try (PreparedStatement updateFocusStmt = conn.prepareStatement(updateFocusSql);
         PreparedStatement updateTxStmt = conn.prepareStatement(updateTxSql);
         PreparedStatement updateStatsStmt = conn.prepareStatement(updateStatsSql)) {

      boolean hasFocusUpdates = false;
      boolean hasStatsUpdates = false;
      Timestamp nowTs = Timestamp.valueOf(LocalDateTime.now());

      for (UserZoneRow userRow : users) {
        List<FocusRecord> userRecords = recordsByUserId.get(userRow.userId());
        if (userRecords == null || userRecords.isEmpty()) {
          continue;
        }

        UserRecalculationPlan plan = FocusRewardRecalculationPlanner.planForUser(
            userRecords, userRow.zoneId(), storageZone);
        if (!plan.hasChanges()) {
          continue;
        }

        for (RecordAdjustment adj : plan.adjustments()) {
          updateFocusStmt.setInt(1, adj.newXp());
          updateFocusStmt.setBigDecimal(2, adj.newCoins());
          updateFocusStmt.setObject(3, adj.recordId());
          updateFocusStmt.addBatch();

          updateTxStmt.setInt(1, adj.newXp());
          updateTxStmt.setBigDecimal(2, adj.newCoins());
          updateTxStmt.setObject(3, adj.recordId());
          updateTxStmt.setObject(4, userRow.userId());
          updateTxStmt.addBatch();

          hasFocusUpdates = true;
        }

        if (plan.totalXpDelta() > 0 || plan.totalCoinsDelta().compareTo(BigDecimal.ZERO) > 0) {
          updateStatsStmt.setInt(1, plan.totalXpDelta());
          updateStatsStmt.setBigDecimal(2, plan.totalCoinsDelta());
          updateStatsStmt.setBigDecimal(3, plan.totalCoinsDelta());
          updateStatsStmt.setTimestamp(4, nowTs);
          updateStatsStmt.setObject(5, userRow.userId());
          updateStatsStmt.addBatch();
          hasStatsUpdates = true;
        }
      }

      if (hasFocusUpdates) {
        updateFocusStmt.executeBatch();
        updateTxStmt.executeBatch();
      }
      if (hasStatsUpdates) {
        updateStatsStmt.executeBatch();
      }
    }
  }

  private List<UserZoneRow> loadUsersWithStats(Connection conn) throws SQLException {
    String sql = """
        SELECT u.user_id, u.timezone
        FROM users u
        INNER JOIN user_stats s ON s.user_id = u.user_id
        """;
    List<UserZoneRow> result = new ArrayList<>();
    try (PreparedStatement stmt = conn.prepareStatement(sql);
         ResultSet rs = stmt.executeQuery()) {
      while (rs.next()) {
        UUID userId = toUuid(rs.getObject("user_id"));
        if (userId != null) {
          result.add(new UserZoneRow(userId, resolveZone(rs.getString("timezone"))));
        }
      }
    }
    return result;
  }

  private Map<UUID, List<FocusRecord>> loadProductiveFocusRecordsByUser(
      Connection conn, boolean hasRewardLocked) throws SQLException {
    String sql = hasRewardLocked
        ? """
            SELECT focus_record_id, user_id, focus_activity_id, task_id, task_name_snapshot,
                   notes, start_time, end_time, record_type, completed_pomos, pomo_target_minutes,
                   xp_earned, coins_earned, reward_locked
            FROM focus_records
            WHERE inventory_item_id IS NULL
              AND start_time IS NOT NULL
              AND end_time IS NOT NULL
            ORDER BY user_id ASC, start_time ASC, end_time ASC, focus_record_id ASC
            """
        : """
            SELECT focus_record_id, user_id, focus_activity_id, task_id, task_name_snapshot,
                   notes, start_time, end_time, record_type, completed_pomos, pomo_target_minutes,
                   xp_earned, coins_earned
            FROM focus_records
            WHERE inventory_item_id IS NULL
              AND start_time IS NOT NULL
              AND end_time IS NOT NULL
            ORDER BY user_id ASC, start_time ASC, end_time ASC, focus_record_id ASC
            """;
    Map<UUID, List<FocusRecord>> byUser = new LinkedHashMap<>();
    try (PreparedStatement stmt = conn.prepareStatement(sql);
         ResultSet rs = stmt.executeQuery()) {
      while (rs.next()) {
        UUID id = toUuid(rs.getObject("focus_record_id"));
        UUID userId = toUuid(rs.getObject("user_id"));
        if (id == null || userId == null) {
          continue;
        }
        Timestamp startTs = rs.getTimestamp("start_time");
        Timestamp endTs = rs.getTimestamp("end_time");
        if (startTs == null || endTs == null) {
          continue;
        }
        LocalDateTime startTime = startTs.toLocalDateTime();
        LocalDateTime endTime = endTs.toLocalDateTime();
        if (endTime.isBefore(startTime)) {
          continue;
        }

        FocusRecordType recordType = parseRecordType(rs.getString("record_type"));
        Integer completedPomos = getNullableInt(rs, "completed_pomos");
        if (recordType == FocusRecordType.POMO && (completedPomos == null || completedPomos < 0)) {
          completedPomos = 0;
        }
        Integer pomoTargetMinutes = getNullableInt(rs, "pomo_target_minutes");
        Integer xpEarned = getNullableInt(rs, "xp_earned");
        BigDecimal coinsEarned = rs.getBigDecimal("coins_earned");
        boolean rewardLocked = hasRewardLocked && rs.getBoolean("reward_locked");

        FocusRecord domainRecord = new FocusRecord(
            id,
            userId,
            toUuid(rs.getObject("focus_activity_id")),
            null,
            toUuid(rs.getObject("task_id")),
            rs.getString("task_name_snapshot"),
            rs.getString("notes"),
            startTime,
            endTime,
            recordType,
            completedPomos,
            pomoTargetMinutes,
            xpEarned != null ? xpEarned : 0,
            coinsEarned != null ? coinsEarned : BigDecimal.ZERO,
            rewardLocked);

        byUser.computeIfAbsent(userId, ignored -> new ArrayList<>()).add(domainRecord);
      }
    }
    return byUser;
  }

  private static UUID toUuid(Object value) {
    if (value == null) return null;
    if (value instanceof UUID uuid) return uuid;
    return UUID.fromString(value.toString());
  }

  private static Integer getNullableInt(ResultSet rs, String column) throws SQLException {
    int val = rs.getInt(column);
    return rs.wasNull() ? null : val;
  }

  private static FocusRecordType parseRecordType(String raw) {
    if (raw == null || raw.isBlank()) {
      return FocusRecordType.STOPWATCH;
    }
    try {
      return FocusRecordType.valueOf(raw.trim().toUpperCase(Locale.ROOT));
    } catch (IllegalArgumentException ex) {
      return FocusRecordType.STOPWATCH;
    }
  }

  private static ZoneId resolveZone(String rawZone) {
    if (rawZone != null && !rawZone.isBlank()) {
      try {
        return ZoneId.of(rawZone.trim());
      } catch (Exception ignored) {
        // fallback para fuso padrão
      }
    }
    try {
      return ZoneId.of(User.DEFAULT_TIMEZONE);
    } catch (Exception ex) {
      return ZoneId.systemDefault();
    }
  }
}
