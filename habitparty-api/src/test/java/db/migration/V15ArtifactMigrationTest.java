package db.migration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.UUID;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class V15ArtifactMigrationTest {

  @Test
  @DisplayName("Flyway deve descobrir automaticamente V15 em classpath:db/migration após V14")
  void flywayShouldDiscoverV15MigrationInClasspath() {
    String url = "jdbc:h2:mem:v15_discovery_" + UUID.randomUUID().toString().replace("-", "")
        + ";MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1";

    Flyway flyway = Flyway.configure()
        .dataSource(url, "sa", "")
        .locations("classpath:db/migration")
        .load();

    boolean hasV15 = Arrays.stream(flyway.info().all())
        .anyMatch(info -> info.getVersion() != null && "15".equals(info.getVersion().getVersion()));
    assertTrue(hasV15);
  }

  @Test
  @DisplayName("Script V15 deve conter seed dos 20 artefatos, colunas de users e backfill de conquistas")
  void v15SqlShouldContainTwentyArtifactsCosmeticColumnsAndBackfill() throws Exception {
    Path migrationPath = Path.of("src/main/resources/db/migration/V15__add_artifacts_and_profile_cosmetics.sql");
    String sql = Files.readString(migrationPath, StandardCharsets.UTF_8);

    assertTrue(sql.contains("equipped_title"));
    assertTrue(sql.contains("avatar_preset"));
    assertTrue(sql.contains("CREATE TABLE IF NOT EXISTS artifacts"));
    assertTrue(sql.contains("CREATE TABLE IF NOT EXISTS user_artifacts"));
    assertTrue(sql.contains("INSERT INTO user_artifacts"));

    long seededArtifactsCount = sql.lines()
        .filter(line -> line.trim().startsWith("('b1000000-0000-4000-8000-"))
        .count();
    assertEquals(20L, seededArtifactsCount);
  }
}
