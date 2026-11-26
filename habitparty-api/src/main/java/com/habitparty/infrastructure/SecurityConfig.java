package com.habitparty.infrastructure;

import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
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

import com.habitparty.adapters.in.web.dtos.response.ErrorResponseDTO;
import com.habitparty.infrastructure.security.BotProtectionFilter;

import tools.jackson.databind.json.JsonMapper;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
  private final SecurityFilter securityFilter;
  private final BotProtectionFilter botProtectionFilter;
  private final JsonMapper jsonMapper = JsonMapper.builder().build();

  @Value("${app.frontend-url:http://localhost:3000}")
  private String frontendUrl;

  @Value("${app.cors.allowed-origins:}")
  private String extraAllowedOrigins;

  @Value("${app.swagger.public:${SPRINGDOC_PUBLIC:false}}")
  private boolean swaggerPublic;

  public SecurityConfig(SecurityFilter securityFilter, BotProtectionFilter botProtectionFilter) {
    this.securityFilter = securityFilter;
    this.botProtectionFilter = botProtectionFilter;
  }

  /**
   * Evita duplo registro na cadeia Servlet raiz (os filtros rodam exclusivamente dentro do SecurityFilterChain).
   */
  @Bean
  public FilterRegistrationBean<SecurityFilter> securityFilterRegistration(SecurityFilter filter) {
    FilterRegistrationBean<SecurityFilter> registration = new FilterRegistrationBean<>(filter);
    registration.setEnabled(false);
    return registration;
  }

  @Bean
  public FilterRegistrationBean<BotProtectionFilter> botProtectionFilterRegistration(BotProtectionFilter filter) {
    FilterRegistrationBean<BotProtectionFilter> registration = new FilterRegistrationBean<>(filter);
    registration.setEnabled(false);
    return registration;
  }

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();

    Set<String> origins = new LinkedHashSet<>();
    if (frontendUrl != null && !frontendUrl.isBlank()) {
      String trimmedFrontend = frontendUrl.trim();
      origins.add(trimmedFrontend);
      if (trimmedFrontend.startsWith("http://localhost:") || trimmedFrontend.startsWith("http://127.0.0.1:")) {
        origins.add("http://localhost:3000");
        origins.add("http://127.0.0.1:3000");
      }
    }
    if (extraAllowedOrigins != null && !extraAllowedOrigins.isBlank()) {
      Arrays.stream(extraAllowedOrigins.split(","))
          .map(String::trim)
          .filter(s -> !s.isEmpty())
          .forEach(origins::add);
    }

    configuration.setAllowedOrigins(List.copyOf(origins));
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
              response.getWriter().write(jsonMapper.writeValueAsString(
                  new ErrorResponseDTO("Não Autorizado", "Token ausente, expirado ou inválido.")));
            })
            .accessDeniedHandler((request, response, accessDeniedException) -> {
              response.setContentType("application/json;charset=UTF-8");
              response.setStatus(403);
              response.getWriter().write(jsonMapper.writeValueAsString(
                  new ErrorResponseDTO("Acesso Negado", "Você não tem permissão para acessar este recurso.")));
            }))
        .authorizeHttpRequests(auth -> {
          // Healthcheck leve
          auth.requestMatchers(HttpMethod.GET, "/health").permitAll();

          // Documentação OpenAPI / Swagger (pública somente se explicitamente habilitada; em produção restrita a ADMIN)
          if (swaggerPublic) {
            auth.requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll();
          } else {
            auth.requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").hasRole("ADMIN");
          }

          // Arquivos públicos de upload (avatares)
          auth.requestMatchers(HttpMethod.GET, "/uploads/**").permitAll();

          // Allowlist explícita de rotas públicas (fail-closed)
          auth.requestMatchers(HttpMethod.POST, "/users").permitAll()
              .requestMatchers("/error").permitAll()
              .requestMatchers(HttpMethod.POST,
                  "/auth/login",
                  "/auth/google",
                  "/auth/refresh",
                  "/auth/forgot-password",
                  "/auth/reset-password",
                  "/auth/verify-email").permitAll()
              .requestMatchers(HttpMethod.POST, "/auth/logout", "/auth/resend-verification").authenticated()
              .requestMatchers(HttpMethod.GET, "/api/v1/payments/founders-quota").permitAll()
              .requestMatchers(HttpMethod.POST, "/api/v1/webhooks/**").permitAll()

              // Rotas administrativas
              .requestMatchers(HttpMethod.GET, "/users").hasRole("ADMIN")
              .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")

              .anyRequest().authenticated();
        })
        .addFilterBefore(botProtectionFilter, UsernamePasswordAuthenticationFilter.class)
        .addFilterBefore(securityFilter, UsernamePasswordAuthenticationFilter.class);

    return http.build();
  }
}
