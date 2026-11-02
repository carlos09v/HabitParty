package com.habitparty.infrastructure;

import java.time.Clock;
import java.time.ZoneId;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Relógio único da aplicação, alinhado ao fuso de negócio (mesmo fuso usado nos @Scheduled).
 * Evita o drift entre o fuso default da JVM (UTC em containers) e America/Sao_Paulo.
 */
@Configuration
public class ClockConfig {

  @Bean
  public Clock applicationClock(@Value("${app.timezone:America/Sao_Paulo}") String timezone) {
    return Clock.system(ZoneId.of(timezone));
  }
}
