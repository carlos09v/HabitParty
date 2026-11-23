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

class V22EffortUnitsAndChecklistTargetMigrationTest {

  @Test
  @DisplayName("Flyway deve descobrir automaticamente V22 em classpath:db/migration após V21")
  void flywayShouldDiscoverV22MigrationInClasspath() {
    String url = "jdbc:h2:mem:v22_discovery_" + UUID.randomUUID().toString().replace("-", "")
        + ";MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1";

    Flyway flyway = Flyway.configure()
        .dataSource(url, "sa", "")
        .locations("classpath:db/migration")
        .load();

    boolean hasV22 = Arrays.stream(flyway.info().all())
        .anyMatch(info -> info.getVersion() != null && "22".equals(info.getVersion().getVersion()));
    assertTrue(hasV22);
  }

  @Test
  @DisplayName("Script V22 deve adicionar effort_units_snapshot e recalibrar CHECKLIST_PERFECTIONIST para 50")
  void v22SqlShouldAddEffortUnitsSnapshotAndUpdateChecklistTarget() throws Exception {
    Path migrationPath = Path.of(
        "src/main/resources/db/migration/V22__add_effort_units_snapshot_and_checklist_target.sql");
    String sql = Files.readString(migrationPath, StandardCharsets.UTF_8);

    assertTrue(sql.contains("ALTER TABLE transaction_history"));
    assertTrue(sql.contains("effort_units_snapshot INT"));
    assertTrue(sql.contains("UPDATE achievements"));
    assertTrue(sql.contains("target_value = 50"));
    assertTrue(sql.contains("CHECKLIST_PERFECTIONIST"));
  }
}
