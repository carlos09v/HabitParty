package com.habitparty.infrastructure;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import com.habitparty.infrastructure.security.BotProtectionFilter;
import com.habitparty.infrastructure.security.TurnstileVerifier;

import jakarta.servlet.FilterChain;

class BotProtectionFilterTest {

  private BotProtectionFilter filter;
  private FilterChain filterChain;

  @BeforeEach
  void setUp() {
    filter = new BotProtectionFilter(new TurnstileVerifier(""));
    filterChain = mock(FilterChain.class);
  }

  @Test
  @DisplayName("Deve bloquear requisição com cabeçalho Honeypot preenchido (403 Forbidden)")
  void shouldBlockHoneypotRequests() throws Exception {
    MockHttpServletRequest request = new MockHttpServletRequest("POST", "/users");
    request.setRemoteAddr("192.168.1.50");
    request.addHeader("X-HP-Trap", "bot-filled-value");
    MockHttpServletResponse response = new MockHttpServletResponse();

    filter.doFilter(request, response, filterChain);

    assertEquals(403, response.getStatus());
    verify(filterChain, never()).doFilter(any(), any());
  }

  @Test
  @DisplayName("Deve aplicar Rate Limiting (429 Too Many Requests) após exceder tentativas em /auth/forgot-password")
  void shouldRateLimitExcessiveForgotPasswordRequests() throws Exception {
    for (int i = 1; i <= 3; i++) {
      MockHttpServletRequest req = new MockHttpServletRequest("POST", "/auth/forgot-password");
      req.setRemoteAddr("10.0.0.99");
      MockHttpServletResponse res = new MockHttpServletResponse();
      filter.doFilter(req, res, filterChain);
      assertEquals(200, res.getStatus());
    }

    // 4ª tentativa do mesmo IP dentro da janela de 15 minutos deve ser bloqueada com 429
    MockHttpServletRequest blockedReq = new MockHttpServletRequest("POST", "/auth/forgot-password");
    blockedReq.setRemoteAddr("10.0.0.99");
    MockHttpServletResponse blockedRes = new MockHttpServletResponse();

    filter.doFilter(blockedReq, blockedRes, filterChain);

    assertEquals(429, blockedRes.getStatus());
    assertNotNull(blockedRes.getHeader("Retry-After"));
  }
}
