package com.habitparty.infrastructure;

import org.springframework.boot.jackson.autoconfigure.JsonMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JacksonConfig {

  @Bean
  public JsonMapperBuilderCustomizer jsonMapperBuilderCustomizer() {
    return builder -> builder.disable(tools.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);
  }
}
