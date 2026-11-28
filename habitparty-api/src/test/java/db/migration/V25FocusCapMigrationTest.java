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

class V25FocusCapMigrationTest {

  @Test
  @DisplayName("V25 deve atualizar sessões de 91-120m no banco e no Histórico, respeitar reward_locked e ser idempotente")
  void shouldUpgradeSessionsBetween90And120MinutesRespectRewardLockedAndBeIdempotent() throws Exception {
    String url = "jdbc:h2:mem:v25_focus_test_" + UUID.randomUUID().toString().replace("-", "")
        + ";MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1";

    UUID userId = UUID.randomUUID();
    UUID activityId = UUID.randomUUID();
    UUID study113Id = UUID.randomUUID();
    UUID study120Id = UUID.randomUUID();
    UUID locked120Id = UUID.randomUUID();
    UUID inventoryId = UUID.randomUUID();

    LocalDateTime day1Start = LocalDateTime.of(2026, 11, 27, 8, 53, 0);
    LocalDateTime day1End = LocalDateTime.of(2026, 11, 27, 10, 46, 0); // 113 min (1h 53m)
    LocalDateTime day2Start = LocalDateTime.of(2026, 11, 26, 14, 0, 0);
    LocalDateTime day2End = LocalDateTime.of(2026, 11, 26, 16, 0, 0); // 120 min (2h)
    LocalDateTime day3Start = LocalDateTime.of(2026, 11, 25, 10, 0, 0);
    LocalDateTime day3End = LocalDateTime.of(2026, 11, 25, 12, 0, 0); // 120 min bloqueado

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
            updated_at TIMESTAMP NOT NULL,
            version BIGINT NOT NULL DEFAULT 0
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
            coins_earned NUMERIC(10, 2),
            reward_locked BOOLEAN NOT NULL DEFAULT FALSE
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

      try (PreparedStatement ps = conn.prepareStatement("""
          INSERT INTO user_stats (user_id, current_coins, total_gold_earned, total_xp, updated_at, version)
          VALUES (?, ?, ?, ?, ?, 0)
          """)) {
        ps.setObject(1, userId);
        ps.setBigDecimal(2, new BigDecimal("10.00"));
        ps.setBigDecimal(3, new BigDecimal("20.00"));
        ps.setInt(4, 100);
        ps.setTimestamp(5, Timestamp.valueOf(day1End));
        ps.executeUpdate();
      }

      // 1. 113m (1h 53m) travado no teto antigo de 90m (21 XP, 1.35 coins) -> deve ir para 26 XP, 1.70 coins (+5 XP, +0.35)
      insertFocusRecord(conn, study113Id, userId, activityId, null, day1Start, day1End,
          "STOPWATCH", null, 113, 21, new BigDecimal("1.35"), false);
      insertTransaction(conn, UUID.randomUUID(), userId, study113Id, 21, new BigDecimal("1.35"), day1End);

      // 2. 120m (2h) travado no teto antigo de 90m (21 XP, 1.35 coins) -> deve ir para 28 XP, 1.80 coins (+7 XP, +0.45)
      insertFocusRecord(conn, study120Id, userId, activityId, null, day2Start, day2End,
          "STOPWATCH", null, 120, 21, new BigDecimal("1.35"), false);
      insertTransaction(conn, UUID.randomUUID(), userId, study120Id, 21, new BigDecimal("1.35"), day2End);

      // 3. 120m com reward_locked=TRUE -> NÃO pode receber upgrade
      insertFocusRecord(conn, locked120Id, userId, activityId, null, day3Start, day3End,
          "STOPWATCH", null, 120, 14, new BigDecimal("0.90"), true);
      insertTransaction(conn, UUID.randomUUID(), userId, locked120Id, 14, new BigDecimal("0.90"), day3End);

      // 4. Registro de inventário -> ignorado
      insertFocusRecord(conn, inventoryId, userId, null, UUID.randomUUID(), day1Start, day1End,
          "STOPWATCH", null, 113, 0, BigDecimal.ZERO, false);

      V25__Recalculate_Focus_Rewards_For_120m_Cap migration = new V25__Recalculate_Focus_Rewards_For_120m_Cap();
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

      assertFocusRow(conn, study113Id, 26, new BigDecimal("1.70"));
      assertTxRow(conn, study113Id, 26, new BigDecimal("1.70"));

      assertFocusRow(conn, study120Id, 28, new BigDecimal("1.80"));
      assertTxRow(conn, study120Id, 28, new BigDecimal("1.80"));

      // Registro bloqueado permanece inalterado
      assertFocusRow(conn, locked120Id, 14, new BigDecimal("0.90"));
      assertTxRow(conn, locked120Id, 14, new BigDecimal("0.90"));

      // Delta total: +12 XP (+5 +7), +0.80 coins (+0.35 +0.45), version 0 -> 1
      assertUserStats(conn, userId, 112, new BigDecimal("10.80"), new BigDecimal("20.80"), 1L);

      // Execução 2 (idempotência)
      migration.migrate(ctx);
      assertUserStats(conn, userId, 112, new BigDecimal("10.80"), new BigDecimal("20.80"), 1L);
    }
  }

  @Test
  @DisplayName("Flyway deve descobrir automaticamente V25 em classpath:db/migration")
  void flywayShouldDiscoverV25JavaMigrationInClasspath() {
    String url = "jdbc:h2:mem:v25_discovery_" + UUID.randomUUID().toString().replace("-", "")
        + ";MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1";

    Flyway flyway = Flyway.configure()
        .dataSource(url, "sa", "")
        .locations("classpath:db/migration")
        .load();

    boolean hasV25 = Arrays.stream(flyway.info().all())
        .anyMatch(info -> info.getVersion() != null && "25".equals(info.getVersion().getVersion()));
    assertTrue(hasV25);
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
      BigDecimal coins,
      boolean rewardLocked) throws Exception {
    try (PreparedStatement ps = conn.prepareStatement("""
        INSERT INTO focus_records (
          focus_record_id, user_id, focus_activity_id, inventory_item_id,
          start_time, end_time, record_type, completed_pomos,
          duration_minutes, xp_earned, coins_earned, reward_locked
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      ps.setBoolean(12, rewardLocked);
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
      Connection conn,
      UUID userId,
      int expectedXp,
      BigDecimal expectedCoins,
      BigDecimal expectedTotalGold,
      long expectedVersion)
      throws Exception {
    try (PreparedStatement ps = conn.prepareStatement(
        "SELECT total_xp, current_coins, total_gold_earned, version FROM user_stats WHERE user_id = ?")) {
      ps.setObject(1, userId);
      try (ResultSet rs = ps.executeQuery()) {
        rs.next();
        assertEquals(expectedXp, rs.getInt(1));
        assertEquals(0, expectedCoins.compareTo(rs.getBigDecimal(2)));
        assertEquals(0, expectedTotalGold.compareTo(rs.getBigDecimal(3)));
        assertEquals(expectedVersion, rs.getLong(4));
      }
    }
  }
}
