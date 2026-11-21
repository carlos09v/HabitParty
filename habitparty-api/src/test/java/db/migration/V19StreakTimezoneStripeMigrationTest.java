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

class V19StreakTimezoneStripeMigrationTest {

  @Test
  @DisplayName("Flyway deve descobrir automaticamente V19 em classpath:db/migration após V18")
  void flywayShouldDiscoverV19MigrationInClasspath() {
    String url = "jdbc:h2:mem:v19_discovery_" + UUID.randomUUID().toString().replace("-", "")
        + ";MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1";

    Flyway flyway = Flyway.configure()
        .dataSource(url, "sa", "")
        .locations("classpath:db/migration")
        .load();

    boolean hasV19 = Arrays.stream(flyway.info().all())
        .anyMatch(info -> info.getVersion() != null && "19".equals(info.getVersion().getVersion()));
    assertTrue(hasV19);
  }

  @Test
  @DisplayName("Script V19 deve criar colunas de integridade de streak/Stripe e índice por end_time sem duplicar índices de V7/V12")
  void v19SqlShouldContainIntegrityColumnsAndIndexes() throws Exception {
    Path migrationPath = Path.of(
        "src/main/resources/db/migration/V19__streak_timezone_stripe_integrity_and_indexes.sql");
    String sql = Files.readString(migrationPath, StandardCharsets.UTF_8);

    assertTrue(sql.contains("last_streak_date DATE"));
    assertTrue(sql.contains("prepaid_ends_at TIMESTAMP"));
    assertTrue(sql.contains("cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE"));
    assertTrue(sql.contains("idx_focus_records_user_end"));
    assertFalse(sql.contains("idx_tx_history_user_ref_type_created"));
    assertFalse(sql.contains("idx_focus_records_task"));
  }
}
