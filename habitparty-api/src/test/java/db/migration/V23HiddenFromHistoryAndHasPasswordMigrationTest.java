package db.migration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.UUID;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationInfo;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class V23HiddenFromHistoryAndHasPasswordMigrationTest {

  private static final int EXPECTED_V23_CHECKSUM = -1829661532;

  @Test
  @DisplayName("Flyway deve descobrir V23 em classpath:db/migration preservando o checksum original")
  void flywayShouldDiscoverV23MigrationWithOriginalChecksum() {
    String url = "jdbc:h2:mem:v23_discovery_" + UUID.randomUUID().toString().replace("-", "")
        + ";MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1";

    Flyway flyway = Flyway.configure()
        .dataSource(url, "sa", "")
        .locations("classpath:db/migration")
        .load();

    MigrationInfo v23 = Arrays.stream(flyway.info().all())
        .filter(info -> info.getVersion() != null && "23".equals(info.getVersion().getVersion()))
        .findFirst()
        .orElse(null);

    assertNotNull(v23);
    assertEquals(EXPECTED_V23_CHECKSUM, v23.getChecksum());
  }

  @Test
  @DisplayName("Script V23 deve adicionar hidden_from_history, has_password e índices compostos de histórico")
  void v23SqlShouldAddHiddenFromHistoryHasPasswordAndCompositeIndexes() throws Exception {
    Path migrationPath = Path.of(
        "src/main/resources/db/migration/V23__add_hidden_from_history_has_password_and_indexes.sql");
    String sql = Files.readString(migrationPath, StandardCharsets.UTF_8);

    assertTrue(sql.contains("ALTER TABLE transaction_history"));
    assertTrue(sql.contains("hidden_from_history BOOLEAN NOT NULL DEFAULT FALSE"));
    assertTrue(sql.contains("ALTER TABLE users"));
    assertTrue(sql.contains("has_password BOOLEAN NOT NULL DEFAULT TRUE"));
    assertTrue(sql.contains("idx_tx_history_user_visible_created"));
    assertTrue(sql.contains("idx_tx_history_user_visible_type_created"));
  }
}
