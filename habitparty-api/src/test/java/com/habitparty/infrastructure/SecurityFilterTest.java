package com.habitparty.infrastructure;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.io.IOException;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import com.habitparty.application.ports.TokenPort;
import com.habitparty.application.ports.TokenPort.TokenPayload;
import com.habitparty.infrastructure.security.AuthenticatedUser;

import jakarta.servlet.ServletException;

@ExtendWith(MockitoExtension.class)
class SecurityFilterTest {

  @Mock
  private TokenPort tokenPort;

  @InjectMocks
  private SecurityFilter securityFilter;

  @BeforeEach
  @AfterEach
  void clearSecurityContext() {
    SecurityContextHolder.clearContext();
  }

  @Test
  @DisplayName("Deve autenticar requisição com sucesso utilizando claims decodificados sem consultar banco de dados")
  void testDoFilterInternalWithValidToken() throws ServletException, IOException {
    UUID userId = UUID.randomUUID();
    String rawToken = "sample.valid.token";

    MockHttpServletRequest request = new MockHttpServletRequest();
    request.addHeader("Authorization", "Bearer " + rawToken);
    MockHttpServletResponse response = new MockHttpServletResponse();
    MockFilterChain filterChain = new MockFilterChain();

    when(tokenPort.validateToken(rawToken)).thenReturn(Optional.of(new TokenPayload(userId, "USER")));

    securityFilter.doFilterInternal(request, response, filterChain);

    var auth = SecurityContextHolder.getContext().getAuthentication();
    assertNotNull(auth);
    assertTrue(auth.isAuthenticated());
    assertTrue(auth.getPrincipal() instanceof AuthenticatedUser);

    AuthenticatedUser principal = (AuthenticatedUser) auth.getPrincipal();
    assertEquals(userId, principal.id());
    assertEquals("USER", principal.role());

    assertTrue(auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_USER")));
  }

  @Test
  @DisplayName("Deve prosseguir sem autenticação caso nenhum cabeçalho Authorization seja fornecido")
  void testDoFilterInternalWithoutHeader() throws ServletException, IOException {
    MockHttpServletRequest request = new MockHttpServletRequest();
    MockHttpServletResponse response = new MockHttpServletResponse();
    MockFilterChain filterChain = new MockFilterChain();

    securityFilter.doFilterInternal(request, response, filterChain);

    assertNull(SecurityContextHolder.getContext().getAuthentication());
    verifyNoInteractions(tokenPort);
  }

  @Test
  @DisplayName("Deve prosseguir sem autenticação caso o token seja inválido ou expirado")
  void testDoFilterInternalWithInvalidToken() throws ServletException, IOException {
    MockHttpServletRequest request = new MockHttpServletRequest();
    request.addHeader("Authorization", "Bearer invalid_token");
    MockHttpServletResponse response = new MockHttpServletResponse();
    MockFilterChain filterChain = new MockFilterChain();

    when(tokenPort.validateToken("invalid_token")).thenReturn(Optional.empty());

    securityFilter.doFilterInternal(request, response, filterChain);

    assertNull(SecurityContextHolder.getContext().getAuthentication());
    verify(tokenPort).validateToken("invalid_token");
  }
}
