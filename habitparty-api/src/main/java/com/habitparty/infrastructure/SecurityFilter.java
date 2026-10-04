package com.habitparty.infrastructure;

import java.io.IOException;
import java.util.List;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.habitparty.adapters.out.persistence.JwtAdapter;
import com.habitparty.adapters.out.persistence.repository.UserJpaRepository;
import com.habitparty.infrastructure.security.AuthenticatedUser;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class SecurityFilter extends OncePerRequestFilter {
  private final JwtAdapter jwtAdapter;
  private final UserJpaRepository userRepository;

  public SecurityFilter(JwtAdapter jwtAdapter, UserJpaRepository userRepository) {
    this.jwtAdapter = jwtAdapter;
    this.userRepository = userRepository;
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {

    var token = this.recoverToken(request);

    if (token != null) {
      var userId = jwtAdapter.validateTokenAndGetUserId(token);

      if (!userId.isEmpty()) {
        // Busca o usuário no banco para montar o contexto de segurança
        var userEntity = userRepository.findById(java.util.UUID.fromString(userId)).orElseThrow();

        // Transforma o cargo do Enum em algo que o Spring Security entenda (ROLE_ADMIN)
        var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + userEntity.getRole().name()));
        
        var authUser = new AuthenticatedUser(userEntity.getId(), userEntity.getRole().name());

        var authentication = new UsernamePasswordAuthenticationToken(authUser, null, authorities);
        SecurityContextHolder.getContext().setAuthentication(authentication);
      }
    }

    // Continua o fluxo da requisição
    filterChain.doFilter(request, response);
  }

  private String recoverToken(HttpServletRequest request) {
        var authHeader = request.getHeader("Authorization");
        if (authHeader == null) return null;
        return authHeader.replace("Bearer ", "");
    }
}
