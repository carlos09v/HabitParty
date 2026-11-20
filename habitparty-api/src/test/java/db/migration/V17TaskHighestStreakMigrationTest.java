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

class V17TaskHighestStreakMigrationTest {

  @Test
  @DisplayName("Flyway deve descobrir automaticamente V17 em classpath:db/migration após V16")
  void flywayShouldDiscoverV17MigrationInClasspath() {
    String url = "jdbc:h2:mem:v17_discovery_" + UUID.randomUUID().toString().replace("-", "")
        + ";MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1";

    Flyway flyway = Flyway.configure()
        .dataSource(url, "sa", "")
        .locations("classpath:db/migration")
        .load();

    boolean hasV17 = Arrays.stream(flyway.info().all())
        .anyMatch(info -> info.getVersion() != null && "17".equals(info.getVersion().getVersion()));
    assertTrue(hasV17);
  }

  @Test
  @DisplayName("Script V17 deve adicionar coluna highest_streak com backfill em daily e habit")
  void v17SqlShouldAddHighestStreakColumnsAndBackfill() throws Exception {
    Path migrationPath = Path.of("src/main/resources/db/migration/V17__add_task_highest_streak.sql");
    String sql = Files.readString(migrationPath, StandardCharsets.UTF_8);

    assertTrue(sql.contains("ALTER TABLE daily"));
    assertTrue(sql.contains("ALTER TABLE habit"));
    assertTrue(sql.contains("highest_streak INT NOT NULL DEFAULT 0"));
    assertTrue(sql.contains("GREATEST(highest_streak, current_streak)"));
  }
}
