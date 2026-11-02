package com.habitparty.infrastructure.security;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

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

  private final Map<String, RateBucket> buckets = new ConcurrentHashMap<>();
  private final TurnstileVerifier turnstileVerifier;

  public BotProtectionFilter() {
    this(new TurnstileVerifier(""));
  }

  @Autowired
  public BotProtectionFilter(TurnstileVerifier turnstileVerifier) {
    this.turnstileVerifier = turnstileVerifier;
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

    // 3. Verifica token do Cloudflare Turnstile quando enviado pelo cliente ou exigido pela rota
    String turnstileToken = request.getHeader("X-Turnstile-Token");
    boolean shouldVerifyTurnstile = (policy.requiresTurnstile() || (turnstileToken != null && !turnstileToken.isBlank()))
        && turnstileVerifier != null
        && turnstileVerifier.isEnabled();
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
      case "/users" -> new RatePolicy("signup", SIGNUP_MAX_REQUESTS, SIGNUP_WINDOW_SECONDS, false);
      case "/auth/login" -> new RatePolicy("login", LOGIN_MAX_REQUESTS, LOGIN_WINDOW_SECONDS, false);
      case "/auth/forgot-password" -> new RatePolicy("forgot-pwd", EMAIL_ACTION_MAX_REQUESTS, EMAIL_ACTION_WINDOW_SECONDS, false);
      case "/auth/resend-verification" -> new RatePolicy("resend-verif", EMAIL_ACTION_MAX_REQUESTS, EMAIL_ACTION_WINDOW_SECONDS, false);
      default -> null;
    };
  }

  private boolean tryConsume(String key, int maxRequests, long windowSeconds) {
    long nowEpochSec = Instant.now().getEpochSecond();

    if (buckets.size() > MAX_BUCKETS) {
      buckets.entrySet().removeIf(e -> nowEpochSec >= e.getValue().resetAtEpochSec);
    }

    RateBucket bucket = buckets.compute(key, (k, existing) -> {
      if (existing == null || nowEpochSec >= existing.resetAtEpochSec) {
        return new RateBucket(new AtomicInteger(1), nowEpochSec + windowSeconds);
      }
      existing.counter.incrementAndGet();
      return existing;
    });

    return bucket.counter.get() <= maxRequests;
  }

  private String extractClientIp(HttpServletRequest request) {
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
    return request.getRemoteAddr() != null ? request.getRemoteAddr() : "unknown";
  }

  private void writeErrorResponse(HttpServletResponse response, int status, String title, String detail)
      throws IOException {
    response.setContentType("application/json;charset=UTF-8");
    response.setStatus(status);
    response.getWriter().write(
        String.format("{\"title\": \"%s\", \"detail\": \"%s\"}", title, detail)
    );
  }

  public void clearBuckets() {
    buckets.clear();
  }

  private record RatePolicy(String keyPrefix, int maxRequests, long windowSeconds, boolean requiresTurnstile) {
  }

  private record RateBucket(AtomicInteger counter, long resetAtEpochSec) {
  }
}
