package com.habitparty.infrastructure.security;

import java.io.IOException;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.habitparty.adapters.in.web.dtos.response.ErrorResponseDTO;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import tools.jackson.databind.json.JsonMapper;

/**
 * Filtro de proteção contra Bots, Força Bruta e abuso de disparo de e-mails (Rate Limiting por IP + Turnstile + Honeypot).
 */
@Component
public class BotProtectionFilter extends OncePerRequestFilter {

  private static final int MAX_BUCKETS = 10_000;

  // Limites por janela de tempo
  private static final int SIGNUP_MAX_REQUESTS = 5;
  private static final long SIGNUP_WINDOW_SECONDS = 15 * 60; // 15 min

  private static final int LOGIN_MAX_REQUESTS = 10;
  private static final long LOGIN_WINDOW_SECONDS = 5 * 60; // 5 min

  private static final int EMAIL_ACTION_MAX_REQUESTS = 3;
  private static final long EMAIL_ACTION_WINDOW_SECONDS = 15 * 60; // 15 min

  private static final int PASSWORD_RESET_MAX_REQUESTS = 5;
  private static final long PASSWORD_RESET_WINDOW_SECONDS = 15 * 60; // 15 min

  private static final int VERIFY_EMAIL_MAX_REQUESTS = 10;
  private static final long VERIFY_EMAIL_WINDOW_SECONDS = 15 * 60; // 15 min

  private static final int REFRESH_MAX_REQUESTS = 30;
  private static final long REFRESH_WINDOW_SECONDS = 5 * 60; // 5 min

  // Cache LRU limitado O(1) — evita OOM e varredura O(N) sob ataque de rotação de IPs
  private final Map<String, RateBucket> buckets = new LinkedHashMap<>(256, 0.75f, true) {
    @Override
    protected boolean removeEldestEntry(Map.Entry<String, RateBucket> eldest) {
      return size() > MAX_BUCKETS;
    }
  };
  private final TurnstileVerifier turnstileVerifier;
  private final boolean enforceTurnstile;
  private final boolean trustProxyHeaders;
  private final JsonMapper jsonMapper = JsonMapper.builder().build();

  public BotProtectionFilter(TurnstileVerifier turnstileVerifier) {
    this(turnstileVerifier, true, false);
  }

  @Autowired
  public BotProtectionFilter(
      TurnstileVerifier turnstileVerifier,
      @Value("${turnstile.enforce-required:${TURNSTILE_ENFORCE_REQUIRED:true}}") boolean enforceTurnstile,
      @Value("${app.security.trust-proxy-headers:${TRUST_PROXY_HEADERS:false}}") boolean trustProxyHeaders) {
    this.turnstileVerifier = turnstileVerifier;
    this.enforceTurnstile = enforceTurnstile;
    this.trustProxyHeaders = trustProxyHeaders;
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request,
      HttpServletResponse response,
      FilterChain filterChain) throws ServletException, IOException {

    if (!"POST".equalsIgnoreCase(request.getMethod())) {
      filterChain.doFilter(request, response);
      return;
    }

    String path = request.getRequestURI();
    RatePolicy policy = resolvePolicy(path);
    if (policy == null) {
      filterChain.doFilter(request, response);
      return;
    }

    String clientIp = extractClientIp(request);

    // 1. Verifica cabeçalho Honeypot (se preenchido por um bot automatizado, bloqueia imediatamente)
    String honeypot = request.getHeader("X-HP-Trap");
    if (honeypot != null && !honeypot.isBlank()) {
      writeErrorResponse(response, 403, "Acesso Bloqueado", "Atividade automatizada suspeita detectada.");
      return;
    }

    // 2. Verifica Rate Limiting na janela de tempo da rota
    String bucketKey = policy.keyPrefix() + ":" + clientIp;
    if (!tryConsume(bucketKey, policy.maxRequests(), policy.windowSeconds())) {
      response.setHeader("Retry-After", String.valueOf(policy.windowSeconds()));
      writeErrorResponse(
          response,
          429,
          "Muitas Tentativas",
          "Muitas requisições em sequência. Aguarde alguns minutos antes de tentar novamente."
      );
      return;
    }

    // 3. Verifica token do Cloudflare Turnstile quando habilitado em produção ou enviado pelo cliente
    String turnstileToken = request.getHeader("X-Turnstile-Token");
    boolean shouldVerifyTurnstile = turnstileVerifier != null
        && turnstileVerifier.isEnabled()
        && (policy.requiresTurnstile() || (turnstileToken != null && !turnstileToken.isBlank()));
    if (shouldVerifyTurnstile) {
      if (!turnstileVerifier.verify(turnstileToken, clientIp)) {
        writeErrorResponse(
            response,
            403,
            "Verificação Anti-Bot Falhou",
            "Não foi possível validar a verificação de segurança contra bots. Atualize a página e tente novamente."
        );
        return;
      }
    }

    filterChain.doFilter(request, response);
  }

  private RatePolicy resolvePolicy(String path) {
    if (path == null) {
      return null;
    }
    return switch (path) {
      case "/users" -> new RatePolicy("signup", SIGNUP_MAX_REQUESTS, SIGNUP_WINDOW_SECONDS, enforceTurnstile);
      case "/auth/login" -> new RatePolicy("login", LOGIN_MAX_REQUESTS, LOGIN_WINDOW_SECONDS, enforceTurnstile);
      case "/auth/google" -> new RatePolicy("google-login", LOGIN_MAX_REQUESTS, LOGIN_WINDOW_SECONDS, false);
      case "/auth/forgot-password" -> new RatePolicy("forgot-pwd", EMAIL_ACTION_MAX_REQUESTS, EMAIL_ACTION_WINDOW_SECONDS, enforceTurnstile);
      case "/auth/resend-verification" -> new RatePolicy("resend-verif", EMAIL_ACTION_MAX_REQUESTS, EMAIL_ACTION_WINDOW_SECONDS, enforceTurnstile);
      case "/auth/reset-password" -> new RatePolicy("reset-pwd", PASSWORD_RESET_MAX_REQUESTS, PASSWORD_RESET_WINDOW_SECONDS, false);
      case "/auth/verify-email" -> new RatePolicy("verify-email", VERIFY_EMAIL_MAX_REQUESTS, VERIFY_EMAIL_WINDOW_SECONDS, false);
      case "/auth/refresh" -> new RatePolicy("refresh", REFRESH_MAX_REQUESTS, REFRESH_WINDOW_SECONDS, false);
      default -> null;
    };
  }

  private boolean tryConsume(String key, int maxRequests, long windowSeconds) {
    long nowEpochSec = Instant.now().getEpochSecond();

    synchronized (buckets) {
      RateBucket existing = buckets.get(key);
      if (existing == null || nowEpochSec >= existing.resetAtEpochSec) {
        buckets.put(key, new RateBucket(1, nowEpochSec + windowSeconds));
        return true;
      }
      int nextCount = existing.count + 1;
      existing.count = nextCount;
      return nextCount <= maxRequests;
    }
  }

  private String extractClientIp(HttpServletRequest request) {
    if (trustProxyHeaders) {
      String cfConnectingIp = request.getHeader("CF-Connecting-IP");
      if (cfConnectingIp != null && !cfConnectingIp.isBlank()) {
        return cfConnectingIp.trim();
      }
      String xForwardedFor = request.getHeader("X-Forwarded-For");
      if (xForwardedFor != null && !xForwardedFor.isBlank()) {
        return xForwardedFor.split(",")[0].trim();
      }
      String xRealIp = request.getHeader("X-Real-IP");
      if (xRealIp != null && !xRealIp.isBlank()) {
        return xRealIp.trim();
      }
    }
    return request.getRemoteAddr() != null ? request.getRemoteAddr() : "unknown";
  }

  private void writeErrorResponse(HttpServletResponse response, int status, String error, String message)
      throws IOException {
    response.setContentType("application/json;charset=UTF-8");
    response.setStatus(status);
    response.getWriter().write(jsonMapper.writeValueAsString(new ErrorResponseDTO(error, message)));
  }

  public void clearBuckets() {
    synchronized (buckets) {
      buckets.clear();
    }
  }

  private record RatePolicy(String keyPrefix, int maxRequests, long windowSeconds, boolean requiresTurnstile) {
  }

  private static final class RateBucket {
    int count;
    final long resetAtEpochSec;

    RateBucket(int count, long resetAtEpochSec) {
      this.count = count;
      this.resetAtEpochSec = resetAtEpochSec;
    }
  }
}
