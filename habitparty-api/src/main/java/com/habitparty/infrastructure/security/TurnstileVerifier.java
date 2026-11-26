package com.habitparty.infrastructure.security;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import com.habitparty.infrastructure.ExternalHttpClientConfig;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

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
  private final RestClient restClient;
  private final JsonMapper jsonMapper;

  private record HttpCallResult(int statusCode, String body) {}

  @Autowired
  public TurnstileVerifier(
      @Value("${turnstile.secret.key:${TURNSTILE_SECRET_KEY:}}") String secretKey,
      @Qualifier(ExternalHttpClientConfig.EXTERNAL_REST_CLIENT_BEAN) @Nullable RestClient externalRestClient,
      @Nullable JsonMapper jsonMapper) {
    this.secretKey = secretKey != null ? secretKey.trim() : "";
    this.restClient = externalRestClient != null ? externalRestClient : buildFallbackRestClient();
    this.jsonMapper = jsonMapper != null ? jsonMapper : JsonMapper.builder().build();
  }

  public TurnstileVerifier(String secretKey) {
    this(secretKey, null, null);
  }

  private static RestClient buildFallbackRestClient() {
    JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory();
    factory.setReadTimeout(Duration.ofSeconds(10));
    return RestClient.builder().requestFactory(factory).build();
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

      HttpCallResult response = restClient.post()
          .uri(VERIFY_URL)
          .contentType(MediaType.APPLICATION_FORM_URLENCODED)
          .body(formBody)
          .exchange((req, res) -> new HttpCallResult(
              res.getStatusCode().value(),
              new String(res.getBody().readAllBytes(), StandardCharsets.UTF_8)));

      String body = response != null ? response.body() : null;
      boolean success = false;
      if (response != null && response.statusCode() == 200 && body != null && !body.isBlank()) {
        JsonNode json = jsonMapper.readTree(body);
        success = json.path("success").asBoolean(false);
      }
      if (!success) {
        log.warn("[TurnstileVerifier] Desafio anti-bot recusado pela Cloudflare para IP {}: status={}",
            remoteIp, response != null ? response.statusCode() : -1);
      }
      return success;
    } catch (Exception e) {
      log.error("[TurnstileVerifier] Erro ao comunicar com Cloudflare Turnstile", e);
      return false;
    }
  }
}
