package com.habitparty.infrastructure;

import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
  private final SecurityFilter securityFilter;

  @Value("${app.frontend-url:http://localhost:3000}")
  private String frontendUrl;

  public SecurityConfig(SecurityFilter securityFilter) {
    this.securityFilter = securityFilter;
  }

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    
    // Origens permitidas (frontend configurado + fallbacks locais para dev)
    configuration.setAllowedOrigins(Arrays.asList(
        frontendUrl,
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ));
    
    configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
    configuration.setAllowedHeaders(Arrays.asList("*"));
    configuration.setAllowCredentials(true);
    configuration.setMaxAge(3600L);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
  }

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))
        .csrf(csrf -> csrf.disable())
        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .exceptionHandling(ex -> ex
            .authenticationEntryPoint((request, response, authException) -> {
              response.setContentType("application/json;charset=UTF-8");
              response.setStatus(401);
              response.getWriter()
                  .write("{\"title\": \"Não Autorizado\", \"detail\": \"Token ausente, expirado ou inválido.\"}");
            }))
        .authorizeHttpRequests(auth -> auth
            // Documentação OpenAPI / Swagger
            .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()

            // Arquivos públicos de upload (avatares)
            .requestMatchers(HttpMethod.GET, "/uploads/**").permitAll()

            // Rotas públicas
            .requestMatchers(HttpMethod.POST, "/users").permitAll()
            .requestMatchers("/error").permitAll()
            .requestMatchers("/auth/**").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/v1/payments/founders-quota").permitAll()
            .requestMatchers(HttpMethod.POST, "/api/v1/webhooks/**").permitAll()
            .requestMatchers(HttpMethod.POST, "/webhooks/**").permitAll()

            // Rotas administrativas
            .requestMatchers(HttpMethod.GET, "/users").hasRole("ADMIN")
            .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")

            .anyRequest().authenticated())
        .addFilterBefore(securityFilter, UsernamePasswordAuthenticationFilter.class);

    return http.build();
  }
}
