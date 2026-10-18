package com.habitparty.infrastructure;

import java.io.IOException;
import java.util.List;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.habitparty.application.ports.TokenPort;
import com.habitparty.infrastructure.security.AuthenticatedUser;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class SecurityFilter extends OncePerRequestFilter {
  private final TokenPort tokenPort;

  public SecurityFilter(TokenPort tokenPort) {
    this.tokenPort = tokenPort;
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {

    var token = this.recoverToken(request);

    if (token != null) {
      var payloadOpt = tokenPort.validateToken(token);

      if (payloadOpt.isPresent()) {
        var payload = payloadOpt.get();
        var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + payload.role()));
        var authUser = new AuthenticatedUser(payload.userId(), payload.role());

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
