package com.habitparty.infrastructure.security;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Verificador do desafio anti-bot Cloudflare Turnstile.
 * Quando TURNSTILE_SECRET_KEY está configurada em produção, valida o token enviado pelo cliente.
 * Em ambiente de desenvolvimento/teste sem chave configurada, opera em modo permissivo.
 */
@Component
public class TurnstileVerifier {
  private static final Logger log = LoggerFactory.getLogger(TurnstileVerifier.class);
  private static final String VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

  private final String secretKey;
  private final HttpClient httpClient;

  public TurnstileVerifier(@Value("${turnstile.secret.key:${TURNSTILE_SECRET_KEY:}}") String secretKey) {
    this.secretKey = secretKey != null ? secretKey.trim() : "";
    this.httpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(10))
        .build();
  }

  public boolean isEnabled() {
    return !secretKey.isEmpty() && !secretKey.startsWith("sua_chave");
  }

  public boolean verify(String token, String remoteIp) {
    if (!isEnabled()) {
      return true;
    }

    if (token == null || token.isBlank()) {
      log.warn("[TurnstileVerifier] Token anti-bot ausente para o IP: {}", remoteIp);
      return false;
    }

    try {
      String formBody = "secret=" + URLEncoder.encode(secretKey, StandardCharsets.UTF_8)
          + "&response=" + URLEncoder.encode(token.trim(), StandardCharsets.UTF_8)
          + (remoteIp != null && !remoteIp.isBlank()
              ? "&remoteip=" + URLEncoder.encode(remoteIp.trim(), StandardCharsets.UTF_8)
              : "");

      HttpRequest request = HttpRequest.newBuilder()
          .uri(URI.create(VERIFY_URL))
          .timeout(Duration.ofSeconds(10))
          .header("Content-Type", "application/x-www-form-urlencoded")
          .POST(HttpRequest.BodyPublishers.ofString(formBody))
          .build();

      HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
      String body = response.body();
      boolean success = response.statusCode() == 200 && body != null && body.contains("\"success\":true");
      if (!success) {
        log.warn("[TurnstileVerifier] Desafio anti-bot recusado pela Cloudflare para IP {}: {}", remoteIp, body);
      }
      return success;
    } catch (Exception e) {
      log.error("[TurnstileVerifier] Erro ao comunicar com Cloudflare Turnstile", e);
      return false;
    }
  }
}
