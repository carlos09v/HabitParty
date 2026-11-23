package db.migration;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.UUID;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class V21ChecklistItemRewardedMigrationTest {

  @Test
  @DisplayName("Flyway deve descobrir automaticamente V21 em classpath:db/migration após V20")
  void flywayShouldDiscoverV21MigrationInClasspath() {
    String url = "jdbc:h2:mem:v21_discovery_" + UUID.randomUUID().toString().replace("-", "")
        + ";MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1";

    Flyway flyway = Flyway.configure()
        .dataSource(url, "sa", "")
        .locations("classpath:db/migration")
        .load();

    boolean hasV21 = Arrays.stream(flyway.info().all())
        .anyMatch(info -> info.getVersion() != null && "21".equals(info.getVersion().getVersion()));
    assertTrue(hasV21);
  }

  @Test
  @DisplayName("Script V21 deve atualizar checklist_item e transaction_history para etapas recompensadas e snapshot")
  void v21SqlShouldAddChecklistAndTransactionSnapshotColumns() throws Exception {
    Path migrationPath = Path.of("src/main/resources/db/migration/V21__add_checklist_item_rewarded.sql");
    String sql = Files.readString(migrationPath, StandardCharsets.UTF_8);

    assertTrue(sql.contains("ALTER TABLE checklist_item"));
    assertTrue(sql.contains("is_rewarded BOOLEAN NOT NULL DEFAULT FALSE"));
    assertTrue(sql.contains("order_index INTEGER NOT NULL DEFAULT 0"));
    assertTrue(sql.contains("auto_completed BOOLEAN NOT NULL DEFAULT FALSE"));
    assertTrue(sql.contains("ALTER TABLE transaction_history"));
    assertTrue(sql.contains("checklist_completed_snapshot BOOLEAN"));
  }
}
