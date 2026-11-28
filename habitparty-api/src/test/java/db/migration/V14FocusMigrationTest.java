package db.migration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.UUID;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.configuration.ClassicConfiguration;
import org.flywaydb.core.api.migration.Context;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class V14FocusMigrationTest {

  @Test
  @DisplayName("V14 deve alinhar created_at do Histórico com end_time, creditar acréscimos positivos de cronômetro e ser idempotente")
  void shouldFixHistoryDatesUpgradeStopwatchRewardsAndBeIdempotent() throws Exception {
    String url = "jdbc:h2:mem:v14_focus_test_" + UUID.randomUUID().toString().replace("-", "")
        + ";MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1";

    UUID userId = UUID.randomUUID();
    UUID activityId = UUID.randomUUID();
    UUID inventoryRecordId = UUID.randomUUID();
    UUID stopwatch45Id = UUID.randomUUID();
    UUID legacyPomo45Id = UUID.randomUUID();
    UUID study92Id = UUID.randomUUID();

    LocalDateTime todayWrongTxTime = LocalDateTime.of(2026, 11, 18, 6, 10, 0);
    LocalDateTime stopwatchStart = LocalDateTime.of(2026, 11, 17, 5, 37, 0);
    LocalDateTime stopwatchEnd = LocalDateTime.of(2026, 11, 17, 6, 22, 0);
    LocalDateTime studyStart = LocalDateTime.of(2026, 11, 16, 14, 50, 0);
    LocalDateTime studyEnd = LocalDateTime.of(2026, 11, 16, 16, 22, 0);
    LocalDateTime legacyPomoStart = LocalDateTime.of(2026, 11, 15, 9, 0, 0);
    LocalDateTime legacyPomoEnd = LocalDateTime.of(2026, 11, 15, 9, 45, 0);

    try (Connection conn = DriverManager.getConnection(url, "sa", "");
         Statement st = conn.createStatement()) {

      st.execute("""
          CREATE TABLE users (
            user_id UUID PRIMARY KEY,
            timezone VARCHAR(64) NOT NULL
          )
          """);
      st.execute("""
          CREATE TABLE user_stats (
            user_id UUID PRIMARY KEY,
            current_coins NUMERIC(10, 2) NOT NULL,
            total_gold_earned NUMERIC(10, 2) NOT NULL,
            total_xp INT NOT NULL,
            updated_at TIMESTAMP NOT NULL
          )
          """);
      st.execute("""
          CREATE TABLE focus_records (
            focus_record_id UUID PRIMARY KEY,
            user_id UUID NOT NULL,
            focus_activity_id UUID,
            inventory_item_id UUID,
            task_id UUID,
            task_name_snapshot VARCHAR(255),
            notes VARCHAR(500),
            start_time TIMESTAMP NOT NULL,
            end_time TIMESTAMP NOT NULL,
            record_type VARCHAR(32),
            completed_pomos INT,
            pomo_target_minutes INT,
            duration_minutes INT NOT NULL,
            xp_earned INT,
            coins_earned NUMERIC(10, 2)
          )
          """);
      st.execute("""
          CREATE TABLE transaction_history (
            transaction_history_id UUID PRIMARY KEY,
            user_id UUID NOT NULL,
            transaction_type VARCHAR(50) NOT NULL,
            reference_id UUID,
            xp_amount INT,
            gold_amount NUMERIC(10, 2),
            created_at TIMESTAMP NOT NULL
          )
          """);

      try (PreparedStatement ps = conn.prepareStatement("INSERT INTO users (user_id, timezone) VALUES (?, ?)")) {
        ps.setObject(1, userId);
        ps.setString(2, "America/Sao_Paulo");
        ps.executeUpdate();
      }

      try (PreparedStatement ps = conn.prepareStatement(
          "INSERT INTO user_stats (user_id, current_coins, total_gold_earned, total_xp, updated_at) VALUES (?, ?, ?, ?, ?)")) {
        ps.setObject(1, userId);
        ps.setBigDecimal(2, new BigDecimal("2.28"));
        ps.setBigDecimal(3, new BigDecimal("5.00"));
        ps.setInt(4, 37);
        ps.setTimestamp(5, Timestamp.valueOf(todayWrongTxTime));
        ps.executeUpdate();
      }

      // 1. 45m STOPWATCH antigo (0.40/30m -> 0.60 coins, 11 XP), recriado com tx errada hoje
      insertFocusRecord(conn, stopwatch45Id, userId, activityId, null, stopwatchStart, stopwatchEnd,
          "STOPWATCH", null, 45, 11, new BigDecimal("0.60"));
      insertTransaction(conn, UUID.randomUUID(), userId, stopwatch45Id, 11, new BigDecimal("0.60"), todayWrongTxTime);

      // 2. 92m STOPWATCH retroativo em 16/11 que recebeu 50% (0.68 / 11 XP) com tx errada hoje
      insertFocusRecord(conn, study92Id, userId, activityId, null, studyStart, studyEnd,
          "STOPWATCH", null, 92, 11, new BigDecimal("0.68"));
      insertTransaction(conn, UUID.randomUUID(), userId, study92Id, 11, new BigDecimal("0.68"), todayWrongTxTime);

      // 3. POMO antigo de 45m (1.00 / 15 XP) — não deve cair para 0.50 / 8 XP
      insertFocusRecord(conn, legacyPomo45Id, userId, activityId, null, legacyPomoStart, legacyPomoEnd,
          "POMO", 1, 45, 15, new BigDecimal("1.00"));
      insertTransaction(conn, UUID.randomUUID(), userId, legacyPomo45Id, 15, new BigDecimal("1.00"), legacyPomoEnd);

      // 4. Registro de cupom (inventory_item_id != null) — ignorado
      insertFocusRecord(conn, inventoryRecordId, userId, null, UUID.randomUUID(), stopwatchStart, stopwatchEnd,
          "STOPWATCH", null, 45, 0, BigDecimal.ZERO);

      V14__Fix_Focus_History_Timestamps_And_Recalculate_Rewards migration =
          new V14__Fix_Focus_History_Timestamps_And_Recalculate_Rewards();
      Context ctx = new Context() {
        @Override
        public org.flywaydb.core.api.configuration.Configuration getConfiguration() {
          return new ClassicConfiguration();
        }

        @Override
        public Connection getConnection() {
          return conn;
        }
      };

      // Execução 1
      migration.migrate(ctx);

      // Timestamps de FOCUS_COMPLETED alinhados com end_time
      assertEquals(stopwatchEnd, queryTxCreatedAt(conn, stopwatch45Id));
      assertEquals(studyEnd, queryTxCreatedAt(conn, study92Id));

      // Valores recalculados (apenas ganhos positivos)
      assertFocusRow(conn, stopwatch45Id, 11, new BigDecimal("0.68"));
      assertTxRow(conn, stopwatch45Id, 11, new BigDecimal("0.68"));

      assertFocusRow(conn, study92Id, 21, new BigDecimal("1.38"));
      assertTxRow(conn, study92Id, 21, new BigDecimal("1.38"));

      // Pomodoro legado 45m preservado sem redução
      assertFocusRow(conn, legacyPomo45Id, 15, new BigDecimal("1.00"));

      // Saldo do usuário incrementado em +10 XP e +0.78 moedas (0.08 + 0.70)
      assertUserStats(conn, userId, 47, new BigDecimal("3.06"), new BigDecimal("5.78"));

      // Execução 2 (idempotência: não duplica acréscimo)
      migration.migrate(ctx);
      assertUserStats(conn, userId, 47, new BigDecimal("3.06"), new BigDecimal("5.78"));
    }
  }

  @Test
  @DisplayName("Flyway deve descobrir automaticamente V14 em classpath:db/migration")
  void flywayShouldDiscoverV14JavaMigrationInClasspath() {
    String url = "jdbc:h2:mem:v14_discovery_" + UUID.randomUUID().toString().replace("-", "")
        + ";MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1";

    Flyway flyway = Flyway.configure()
        .dataSource(url, "sa", "")
        .locations("classpath:db/migration")
        .load();

    boolean hasV14 = Arrays.stream(flyway.info().all())
        .anyMatch(info -> info.getVersion() != null && "14".equals(info.getVersion().getVersion()));
    assertTrue(hasV14);
  }

  private static void insertFocusRecord(
      Connection conn,
      UUID id,
      UUID userId,
      UUID activityId,
      UUID inventoryItemId,
      LocalDateTime start,
      LocalDateTime end,
      String type,
      Integer pomos,
      int durationMinutes,
      int xp,
      BigDecimal coins) throws Exception {
    try (PreparedStatement ps = conn.prepareStatement("""
        INSERT INTO focus_records (
          focus_record_id, user_id, focus_activity_id, inventory_item_id,
          start_time, end_time, record_type, completed_pomos,
          duration_minutes, xp_earned, coins_earned
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """)) {
      ps.setObject(1, id);
      ps.setObject(2, userId);
      ps.setObject(3, activityId);
      ps.setObject(4, inventoryItemId);
      ps.setTimestamp(5, Timestamp.valueOf(start));
      ps.setTimestamp(6, Timestamp.valueOf(end));
      ps.setString(7, type);
      if (pomos == null) {
        ps.setNull(8, java.sql.Types.INTEGER);
      } else {
        ps.setInt(8, pomos);
      }
      ps.setInt(9, durationMinutes);
      ps.setInt(10, xp);
      ps.setBigDecimal(11, coins);
      ps.executeUpdate();
    }
  }

  private static void insertTransaction(
      Connection conn,
      UUID id,
      UUID userId,
      UUID referenceId,
      int xp,
      BigDecimal gold,
      LocalDateTime createdAt) throws Exception {
    try (PreparedStatement ps = conn.prepareStatement("""
        INSERT INTO transaction_history (
          transaction_history_id, user_id, transaction_type, reference_id,
          xp_amount, gold_amount, created_at
        ) VALUES (?, ?, 'FOCUS_COMPLETED', ?, ?, ?, ?)
        """)) {
      ps.setObject(1, id);
      ps.setObject(2, userId);
      ps.setObject(3, referenceId);
      ps.setInt(4, xp);
      ps.setBigDecimal(5, gold);
      ps.setTimestamp(6, Timestamp.valueOf(createdAt));
      ps.executeUpdate();
    }
  }

  private static LocalDateTime queryTxCreatedAt(Connection conn, UUID refId) throws Exception {
    try (PreparedStatement ps = conn.prepareStatement(
        "SELECT created_at FROM transaction_history WHERE reference_id = ?")) {
      ps.setObject(1, refId);
      try (ResultSet rs = ps.executeQuery()) {
        rs.next();
        return rs.getTimestamp(1).toLocalDateTime();
      }
    }
  }

  private static void assertFocusRow(Connection conn, UUID id, int expectedXp, BigDecimal expectedCoins)
      throws Exception {
    try (PreparedStatement ps = conn.prepareStatement(
        "SELECT xp_earned, coins_earned FROM focus_records WHERE focus_record_id = ?")) {
      ps.setObject(1, id);
      try (ResultSet rs = ps.executeQuery()) {
        rs.next();
        assertEquals(expectedXp, rs.getInt(1));
        assertEquals(0, expectedCoins.compareTo(rs.getBigDecimal(2)));
      }
    }
  }

  private static void assertTxRow(Connection conn, UUID refId, int expectedXp, BigDecimal expectedCoins)
      throws Exception {
    try (PreparedStatement ps = conn.prepareStatement(
        "SELECT xp_amount, gold_amount FROM transaction_history WHERE reference_id = ?")) {
      ps.setObject(1, refId);
      try (ResultSet rs = ps.executeQuery()) {
        rs.next();
        assertEquals(expectedXp, rs.getInt(1));
        assertEquals(0, expectedCoins.compareTo(rs.getBigDecimal(2)));
      }
    }
  }

  private static void assertUserStats(
      Connection conn, UUID userId, int expectedXp, BigDecimal expectedCoins, BigDecimal expectedTotalGold)
      throws Exception {
    try (PreparedStatement ps = conn.prepareStatement(
        "SELECT total_xp, current_coins, total_gold_earned FROM user_stats WHERE user_id = ?")) {
      ps.setObject(1, userId);
      try (ResultSet rs = ps.executeQuery()) {
        rs.next();
        assertEquals(expectedXp, rs.getInt(1));
        assertEquals(0, expectedCoins.compareTo(rs.getBigDecimal(2)));
        assertEquals(0, expectedTotalGold.compareTo(rs.getBigDecimal(3)));
      }
    }
  }
}
