package db.migration;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.UUID;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class V24JpaVersioningIndexesAndShedLockMigrationTest {

  private static final Path V24_PATH = Path.of(
      "src/main/resources/db/migration/V24__jpa_versioning_focus_reward_lock_indexes_and_shedlock.sql");

  @Test
  @DisplayName("Flyway deve descobrir V24 consolidada após V23 sem sobra de V25")
  void flywayShouldDiscoverConsolidatedV24MigrationWithoutV25() {
    String url = "jdbc:h2:mem:v24_discovery_" + UUID.randomUUID().toString().replace("-", "")
        + ";MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1";

    Flyway flyway = Flyway.configure()
        .dataSource(url, "sa", "")
        .locations("classpath:db/migration")
        .load();

    var allMigrations = flyway.info().all();
    boolean hasV24 = Arrays.stream(allMigrations)
        .anyMatch(info -> info.getVersion() != null && "24".equals(info.getVersion().getVersion()));
    boolean hasV25 = Arrays.stream(allMigrations)
        .anyMatch(info -> info.getVersion() != null && "25".equals(info.getVersion().getVersion()));

    assertTrue(hasV24);
    assertFalse(hasV25);
  }

  @Test
  @DisplayName("Script V24 deve adicionar reward_locked, colunas @Version, reminder_attempts, shedlock, limpar índices V4 e criar índices novos")
  void v24SqlShouldContainVersioningShedLockIndexDropsAndPerformanceIndexes() throws Exception {
    String sql = Files.readString(V24_PATH, StandardCharsets.UTF_8);

    assertTrue(sql.contains("reward_locked BOOLEAN NOT NULL DEFAULT FALSE"));
    assertTrue(sql.contains("ALTER TABLE user_stats"));
    assertTrue(sql.contains("ALTER TABLE user_subscriptions"));
    assertTrue(sql.contains("ALTER TABLE inventory_items"));
    assertTrue(sql.contains("ALTER TABLE tasks"));
    assertTrue(sql.contains("version BIGINT NOT NULL DEFAULT 0"));
    assertTrue(sql.contains("reminder_attempts INT NOT NULL DEFAULT 0"));

    assertTrue(sql.contains("CREATE TABLE IF NOT EXISTS shedlock"));
    assertTrue(sql.contains("name VARCHAR(64) NOT NULL"));
    assertTrue(sql.contains("lock_until TIMESTAMP NOT NULL"));
    assertTrue(sql.contains("locked_at TIMESTAMP NOT NULL"));
    assertTrue(sql.contains("locked_by VARCHAR(255) NOT NULL"));
    assertTrue(sql.contains("PRIMARY KEY (name)"));

    assertTrue(sql.contains("DROP INDEX IF EXISTS idx_user_subscriptions_stripe_customer_id"));
    assertTrue(sql.contains("DROP INDEX IF EXISTS idx_processed_payment_events_stripe_id"));

    assertTrue(sql.contains("idx_users_lower_username"));
    assertTrue(sql.contains("idx_tx_history_user_type_created"));
    assertTrue(sql.contains("idx_tx_history_focus_reference"));
    assertTrue(sql.contains("idx_social_notifications_actor_id"));
    assertTrue(sql.contains("idx_social_notifications_ref_type_unseen"));
    assertTrue(sql.contains("idx_refresh_tokens_expiration_date"));
    assertTrue(sql.contains("idx_tasks_user_task_type"));
    assertTrue(sql.contains("idx_focus_records_user_end_productive"));
    assertTrue(sql.contains("idx_email_dispatch_logs_user_sent"));
    assertTrue(sql.contains("idx_email_dispatch_logs_status_sent"));
    assertTrue(sql.contains("idx_checklist_item_task_order"));
  }
}
