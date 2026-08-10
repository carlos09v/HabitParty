package com.habitparty.infrastructure;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
  @Bean
  public PasswordEncoder passwordEncoder() {
    // O BCrypt gera um "salt" aleatório automaticamente para cada senha, o que impede ataques de Rainbow Table (tabelas de senhas pré-calculadas).
    return new BCryptPasswordEncoder();
  }

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
        .csrf(csrf -> csrf.disable()) // Desabilita CSRF para APIs REST
        .authorizeHttpRequests(auth -> auth
            // Rotas Públicas (Qualquer um acessa sem token)
            .requestMatchers(HttpMethod.POST, "/users").permitAll() 
            .requestMatchers("/login").permitAll()
            
            // Rotas Protegidas por Cargo (RBAC em ação!)
            .requestMatchers(HttpMethod.GET, "/users").hasRole("ADMIN") // Só ADMIN entra
            
            // Todas as outras rotas exigem que o usuário esteja logado (mas qualquer cargo serve)
            .anyRequest().authenticated()
        );
        
        // Futuramente, adicionaremos o addFilterBefore() do JWT aqui.

    return http.build();
  }
}
