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

class V20DebtPaidTransactionTypeMigrationTest {

  @Test
  @DisplayName("Flyway deve descobrir automaticamente V20 em classpath:db/migration após V19")
  void flywayShouldDiscoverV20MigrationInClasspath() {
    String url = "jdbc:h2:mem:v20_discovery_" + UUID.randomUUID().toString().replace("-", "")
        + ";MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1";

    Flyway flyway = Flyway.configure()
        .dataSource(url, "sa", "")
        .locations("classpath:db/migration")
        .load();

    boolean hasV20 = Arrays.stream(flyway.info().all())
        .anyMatch(info -> info.getVersion() != null && "20".equals(info.getVersion().getVersion()));
    assertTrue(hasV20);
  }

  @Test
  @DisplayName("Script V20 deve aceitar DEBT_PAID na constraint e converter dívidas já quitadas")
  void v20SqlShouldAllowDebtPaidAndBackfillSettledDebts() throws Exception {
    Path migrationPath = Path.of(
        "src/main/resources/db/migration/V20__add_debt_paid_transaction_type.sql");
    String sql = Files.readString(migrationPath, StandardCharsets.UTF_8);

    assertTrue(sql.contains("'DEBT_PAID'"));
    assertTrue(sql.contains("transaction_history_transaction_type_check"));
    assertTrue(sql.contains("SET transaction_type = 'DEBT_PAID'"));
    assertTrue(sql.contains("FROM public.inventory_items ii"));
  }
}
