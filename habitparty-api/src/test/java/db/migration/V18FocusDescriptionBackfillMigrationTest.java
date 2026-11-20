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

class V18FocusDescriptionBackfillMigrationTest {

  @Test
  @DisplayName("Flyway deve descobrir automaticamente V18 em classpath:db/migration após V17")
  void flywayShouldDiscoverV18MigrationInClasspath() {
    String url = "jdbc:h2:mem:v18_discovery_" + UUID.randomUUID().toString().replace("-", "")
        + ";MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1";

    Flyway flyway = Flyway.configure()
        .dataSource(url, "sa", "")
        .locations("classpath:db/migration")
        .load();

    boolean hasV18 = Arrays.stream(flyway.info().all())
        .anyMatch(info -> info.getVersion() != null && "18".equals(info.getVersion().getVersion()));
    assertTrue(hasV18);
  }

  @Test
  @DisplayName("Script V18 deve expandir description_snapshot para 500 chars e fazer backfill de focus_records.notes em FOCUS_COMPLETED")
  void v18SqlShouldExpandDescriptionSnapshotAndBackfillFocusNotes() throws Exception {
    Path migrationPath = Path.of(
        "src/main/resources/db/migration/V18__backfill_focus_description_snapshot_in_transaction_history.sql");
    String sql = Files.readString(migrationPath, StandardCharsets.UTF_8);

    assertTrue(sql.contains("ALTER COLUMN description_snapshot TYPE VARCHAR(500)"));
    assertTrue(sql.contains("FROM public.focus_records fr"));
    assertTrue(sql.contains("th.reference_id = fr.focus_record_id"));
    assertTrue(sql.contains("th.transaction_type = 'FOCUS_COMPLETED'"));
    assertTrue(sql.contains("LEFT(TRIM(fr.notes), 500)"));
  }
}
