package com.habitparty.adapters.out.oauth;

import java.net.ProxySelector;
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

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.habitparty.application.ports.OAuthIdentityProviderPort;
import com.habitparty.core.domain.entities.auth.OAuthUserProfile;
import com.habitparty.core.exceptions.DomainValidationException;

@Component
public class GoogleOAuthAdapter implements OAuthIdentityProviderPort {
  private static final Logger log = LoggerFactory.getLogger(GoogleOAuthAdapter.class);

  private final ObjectMapper objectMapper;
  private final HttpClient httpClient;
  private final String clientId;
  private final String clientSecret;
  private final String redirectUri;

  public GoogleOAuthAdapter(
      @Value("${google.client.id:${GOOGLE_CLIENT_ID:}}") String clientId,
      @Value("${google.client.secret:${GOOGLE_CLIENT_SECRET:}}") String clientSecret,
      @Value("${google.client.redirect-uri:${GOOGLE_REDIRECT_URI:http://localhost:3000/auth/callback}}") String redirectUri) {
    this.objectMapper = new ObjectMapper();
    this.clientId = clientId != null ? clientId.trim() : "";
    this.clientSecret = clientSecret != null ? clientSecret.trim() : "";
    this.redirectUri = redirectUri != null ? redirectUri.trim() : "http://localhost:3000/auth/callback";
    this.httpClient = HttpClient.newBuilder()
        .version(HttpClient.Version.HTTP_1_1)
        .proxy(ProxySelector.getDefault())
        .followRedirects(HttpClient.Redirect.NORMAL)
        .connectTimeout(Duration.ofSeconds(20))
        .build();
  }

  @Override
  public OAuthUserProfile fetchUserProfile(String authorizationCode) {
    if (clientId.isEmpty() || clientSecret.isEmpty()) {
      throw new DomainValidationException("Google OAuth não está configurado no servidor (client id ou secret ausentes).");
    }

    if (authorizationCode == null || authorizationCode.isBlank()) {
      throw new DomainValidationException("O código de autorização é obrigatório.");
    }

    GoogleTokens tokens = exchangeCodeForGoogleToken(authorizationCode.trim());

    // 1. Tenta extrair o perfil diretamente do id_token (evita roundtrip HTTP extra e timeouts de rede)
    OAuthUserProfile profileFromIdToken = extractProfileFromIdToken(tokens.idToken());
    if (profileFromIdToken != null && profileFromIdToken.email() != null && !profileFromIdToken.email().isBlank()) {
      log.debug("[GoogleOAuthAdapter] Perfil do usuário extraído com sucesso a partir do id_token.");
      return profileFromIdToken;
    }

    // 2. Se id_token não estiver presente, consulta o endpoint userinfo como fallback
    return fetchGoogleUserProfile(tokens.accessToken());
  }

  private record GoogleTokens(String accessToken, String idToken) {}

  private GoogleTokens exchangeCodeForGoogleToken(String code) {
    try {
      String formBody = String.format(
          "code=%s&client_id=%s&client_secret=%s&redirect_uri=%s&grant_type=authorization_code",
          URLEncoder.encode(code, StandardCharsets.UTF_8),
          URLEncoder.encode(clientId, StandardCharsets.UTF_8),
          URLEncoder.encode(clientSecret, StandardCharsets.UTF_8),
          URLEncoder.encode(redirectUri, StandardCharsets.UTF_8)
      );

      HttpRequest request = HttpRequest.newBuilder()
          .uri(URI.create("https://oauth2.googleapis.com/token"))
          .timeout(Duration.ofSeconds(15))
          .header("Content-Type", "application/x-www-form-urlencoded")
          .POST(HttpRequest.BodyPublishers.ofString(formBody))
          .build();

      HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

      if (response.statusCode() != 200) {
        log.error("[GoogleOAuthAdapter] Erro ao trocar code pelo token do Google. Status: {}, Body: {}",
            response.statusCode(), response.body());
        throw new DomainValidationException("Código de autenticação do Google expirado ou inválido.");
      }

      JsonNode jsonNode = objectMapper.readTree(response.body());
      String accessToken = jsonNode.path("access_token").asText(null);
      String idToken = jsonNode.path("id_token").asText(null);

      if (accessToken == null || accessToken.isBlank()) {
        throw new DomainValidationException("Resposta do Google não continha token de acesso.");
      }

      return new GoogleTokens(accessToken, idToken);
    } catch (DomainValidationException e) {
      throw e;
    } catch (Exception e) {
      log.error("[GoogleOAuthAdapter] Exceção durante troca de token com Google", e);
      throw new DomainValidationException("Erro de comunicação com os servidores do Google.");
    }
  }

  private OAuthUserProfile extractProfileFromIdToken(String idToken) {
    if (idToken == null || idToken.isBlank()) {
      return null;
    }
    try {
      String[] parts = idToken.split("\\.");
      if (parts.length < 2) {
        return null;
      }
      byte[] decodedBytes = java.util.Base64.getUrlDecoder().decode(parts[1]);
      String payloadJson = new String(decodedBytes, StandardCharsets.UTF_8);
      JsonNode node = objectMapper.readTree(payloadJson);

      String email = node.path("email").asText(null);
      String name = node.path("name").asText(null);
      String picture = node.path("picture").asText(null);

      if (email != null && !email.isBlank()) {
        JsonNode verifiedNode = node.get("email_verified");
        if (verifiedNode != null && !verifiedNode.isNull()) {
          if (!isEmailVerified(node)) {
            throw new DomainValidationException("O endereço de e-mail da conta Google não está verificado.");
          }
          return new OAuthUserProfile(email, name, picture);
        }
      }
    } catch (DomainValidationException e) {
      throw e;
    } catch (Exception e) {
      log.warn("[GoogleOAuthAdapter] Não foi possível ler claims do id_token: {}", e.getMessage());
    }
    return null;
  }

  private OAuthUserProfile fetchGoogleUserProfile(String googleAccessToken) {
    try {
      HttpRequest request = HttpRequest.newBuilder()
          .uri(URI.create("https://www.googleapis.com/oauth2/v3/userinfo"))
          .timeout(Duration.ofSeconds(10))
          .header("Authorization", "Bearer " + googleAccessToken)
          .GET()
          .build();

      HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

      if (response.statusCode() != 200) {
        log.error("[GoogleOAuthAdapter] Falha ao obter dados do usuário no Google. Status: {}, Body: {}",
            response.statusCode(), response.body());
        throw new DomainValidationException("Falha ao recuperar informações da conta Google.");
      }

      JsonNode node = objectMapper.readTree(response.body());
      String email = node.path("email").asText(null);
      String name = node.path("name").asText(null);
      String picture = node.path("picture").asText(null);

      if (email == null || email.isBlank()) {
        throw new DomainValidationException("A conta Google não retornou um endereço de e-mail válido.");
      }

      if (!isEmailVerified(node)) {
        throw new DomainValidationException("O endereço de e-mail da conta Google não está verificado.");
      }

      return new OAuthUserProfile(email, name, picture);
    } catch (DomainValidationException e) {
      throw e;
    } catch (Exception e) {
      log.error("[GoogleOAuthAdapter] Exceção ao buscar userinfo do Google", e);
      throw new DomainValidationException("Falha ao consultar perfil do Google.");
    }
  }

  private boolean isEmailVerified(JsonNode node) {
    JsonNode verifiedNode = node.get("email_verified");
    if (verifiedNode == null || verifiedNode.isNull()) {
      return false;
    }
    if (verifiedNode.isBoolean()) {
      return verifiedNode.booleanValue();
    }
    return "true".equalsIgnoreCase(verifiedNode.asText());
  }
}
