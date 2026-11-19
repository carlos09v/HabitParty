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

class V16OnboardingPreferencesMigrationTest {

  @Test
  @DisplayName("Flyway deve descobrir automaticamente V16 em classpath:db/migration após V15")
  void flywayShouldDiscoverV16MigrationInClasspath() {
    String url = "jdbc:h2:mem:v16_discovery_" + UUID.randomUUID().toString().replace("-", "")
        + ";MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1";

    Flyway flyway = Flyway.configure()
        .dataSource(url, "sa", "")
        .locations("classpath:db/migration")
        .load();

    boolean hasV16 = Arrays.stream(flyway.info().all())
        .anyMatch(info -> info.getVersion() != null && "16".equals(info.getVersion().getVersion()));
    assertTrue(hasV16);
  }

  @Test
  @DisplayName("Script V16 deve adicionar colunas de preferências do onboarding na tabela users")
  void v16SqlShouldAddOnboardingPreferenceColumns() throws Exception {
    Path migrationPath = Path.of("src/main/resources/db/migration/V16__add_user_onboarding_preferences.sql");
    String sql = Files.readString(migrationPath, StandardCharsets.UTF_8);

    assertTrue(sql.contains("usage_mode"));
    assertTrue(sql.contains("primary_goals"));
    assertTrue(sql.contains("main_obstacle"));
    assertTrue(sql.contains("daily_focus_goal_minutes"));
    assertTrue(sql.contains("peak_period"));
    assertTrue(sql.contains("discipline_style"));
  }
}
