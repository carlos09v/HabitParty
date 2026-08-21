package com.habitparty.infrastructure;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
  private final SecurityFilter securityFilter;

  public SecurityConfig(SecurityFilter securityFilter) {
    this.securityFilter = securityFilter;
  }

  @Bean
  public PasswordEncoder passwordEncoder() {
    // O BCrypt gera um "salt" aleatório automaticamente para cada senha, o que impede ataques de Rainbow Table (tabelas de senhas pré-calculadas).
    return new BCryptPasswordEncoder();
  }

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
        .csrf(csrf -> csrf.disable())
        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)) // Muito importante para REST
        // TRATAR ERROS DE TOKEN ----
        .exceptionHandling(ex -> ex
            .authenticationEntryPoint((request, response, authException) -> {
              response.setContentType("application/json;charset=UTF-8");
              response.setStatus(401); // 401 Unauthorized é o correto para falta de token
              response.getWriter()
                  .write("{\"title\": \"Não Autorizado\", \"detail\": \"Token ausente, expirado ou inválido.\"}");
            }))
        // Bloqueio de Rotas
        .authorizeHttpRequests(auth -> auth
            // --- ROTAS DO SWAGGER LIBERADAS ---
            .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()

            
            // Suas outras rotas públicas
            .requestMatchers(HttpMethod.POST, "/users").permitAll()
            .requestMatchers("/error").permitAll()
            .requestMatchers("/auth/**").permitAll() // Libera login, refresh, etc

            .requestMatchers(HttpMethod.GET, "/users").hasRole("ADMIN")
            .anyRequest().authenticated())
        // ADiz pro Spring rodar o filtro antes do dele!
        .addFilterBefore(securityFilter, UsernamePasswordAuthenticationFilter.class);

    return http.build();
  }
}
