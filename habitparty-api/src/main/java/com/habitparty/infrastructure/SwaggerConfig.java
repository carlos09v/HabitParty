package com.habitparty.infrastructure;

import org.springdoc.core.utils.SpringDocUtils;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.habitparty.infrastructure.security.CurrentUserId;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;

@Configuration
public class SwaggerConfig {

  static {
    SpringDocUtils.getConfig().addAnnotationsToIgnore(CurrentUserId.class);
  }

  @Bean
  public OpenAPI customOpenAPI() {
    final String securitySchemeName = "bearerAuth";

    return new OpenAPI()
        .info(new Info()
            .title("HabitParty API")
            .version("v1.4.9")
            .description("Documentação completa da API do HabitParty"))
        // Adiciona o cadeado de segurança globalmente nas rotas
        .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
        // Ensina o Swagger que a segurança é feita via Token JWT (Bearer)
        .components(new Components()
            .addSecuritySchemes(securitySchemeName, new SecurityScheme()
                .name(securitySchemeName)
                .type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT")));
  }
}
