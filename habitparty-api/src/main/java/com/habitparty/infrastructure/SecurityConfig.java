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
        .authorizeHttpRequests(auth -> auth
            .requestMatchers(HttpMethod.POST, "/users").permitAll()
            .requestMatchers("/login").permitAll()
            .requestMatchers(HttpMethod.GET, "/users").hasRole("ADMIN")
            .anyRequest().authenticated())
        // AQUI ESTÁ A MÁGICA: Diz pro Spring rodar o nosso filtro antes do dele!
        .addFilterBefore(securityFilter, UsernamePasswordAuthenticationFilter.class);

    return http.build();
  }
}
