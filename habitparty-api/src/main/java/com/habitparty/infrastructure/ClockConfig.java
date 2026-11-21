package com.habitparty.infrastructure;

import java.time.Clock;
import java.time.ZoneId;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Relógio único da aplicação, alinhado em UTC junto à JVM e às conversões de storage no Postgres.
 * Datas civis de usuário continuam sendo derivadas por {@code clock.withZone(userZone)}.
 */
@Configuration
public class ClockConfig {

  @Bean
  public Clock applicationClock(@Value("${app.timezone:UTC}") String timezone) {
    return Clock.system(ZoneId.of(timezone));
  }
}
