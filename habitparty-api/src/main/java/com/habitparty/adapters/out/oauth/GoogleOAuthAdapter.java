package com.habitparty.adapters.out.oauth;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import com.habitparty.application.ports.OAuthIdentityProviderPort;
import com.habitparty.core.domain.entities.auth.OAuthUserProfile;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.infrastructure.ExternalHttpClientConfig;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

@Component
public class GoogleOAuthAdapter implements OAuthIdentityProviderPort {
  private static final Logger log = LoggerFactory.getLogger(GoogleOAuthAdapter.class);
  private static final String GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
  private static final String GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";
  private static final Set<String> VALID_GOOGLE_ISSUERS = Set.of(
      "https://accounts.google.com",
      "accounts.google.com");

  private final JsonMapper jsonMapper;
  private final RestClient restClient;
  private final String clientId;
  private final String clientSecret;
  private final String redirectUri;

  private record GoogleTokens(String accessToken, String idToken) {}

  private record HttpCallResult(int statusCode, String body) {}

  @Autowired
  public GoogleOAuthAdapter(
      @Value("${google.client.id:${GOOGLE_CLIENT_ID:}}") String clientId,
      @Value("${google.client.secret:${GOOGLE_CLIENT_SECRET:}}") String clientSecret,
      @Value("${google.client.redirect-uri:${GOOGLE_REDIRECT_URI:http://localhost:3000/auth/callback}}") String redirectUri,
      @Qualifier(ExternalHttpClientConfig.EXTERNAL_REST_CLIENT_BEAN) @Nullable RestClient externalRestClient,
      @Nullable JsonMapper jsonMapper) {
    this.jsonMapper = jsonMapper != null ? jsonMapper : JsonMapper.builder().build();
    this.restClient = externalRestClient != null ? externalRestClient : buildFallbackRestClient();
    this.clientId = clientId != null ? clientId.trim() : "";
    this.clientSecret = clientSecret != null ? clientSecret.trim() : "";
    this.redirectUri = redirectUri != null ? redirectUri.trim() : "http://localhost:3000/auth/callback";
  }

  public GoogleOAuthAdapter(String clientId, String clientSecret, String redirectUri) {
    this(clientId, clientSecret, redirectUri, null, null);
  }

  private static RestClient buildFallbackRestClient() {
    JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory();
    factory.setReadTimeout(Duration.ofSeconds(15));
    return RestClient.builder().requestFactory(factory).build();
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

  private GoogleTokens exchangeCodeForGoogleToken(String code) {
    try {
      String formBody = String.format(
          "code=%s&client_id=%s&client_secret=%s&redirect_uri=%s&grant_type=authorization_code",
          URLEncoder.encode(code, StandardCharsets.UTF_8),
          URLEncoder.encode(clientId, StandardCharsets.UTF_8),
          URLEncoder.encode(clientSecret, StandardCharsets.UTF_8),
          URLEncoder.encode(redirectUri, StandardCharsets.UTF_8)
      );

      // authorization_code é de uso único no OAuth2 — não repetir POST cegamente em caso de erro de leitura
      HttpCallResult response = restClient.post()
          .uri(GOOGLE_TOKEN_URL)
          .contentType(MediaType.APPLICATION_FORM_URLENCODED)
          .body(formBody)
          .exchange((req, res) -> new HttpCallResult(
              res.getStatusCode().value(),
              new String(res.getBody().readAllBytes(), StandardCharsets.UTF_8)));

      if (response == null || response.statusCode() != 200) {
        log.error("[GoogleOAuthAdapter] Erro ao trocar code pelo token do Google. Status: {}, Body: {}",
            response != null ? response.statusCode() : -1, response != null ? response.body() : "<vazio>");
        throw new DomainValidationException("Código de autenticação do Google expirado ou inválido.");
      }

      JsonNode jsonNode = jsonMapper.readTree(response.body());
      String accessToken = jsonNode.path("access_token").asString(null);
      String idToken = jsonNode.path("id_token").asString(null);

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

  OAuthUserProfile extractProfileFromIdToken(String idToken) {
    if (idToken == null || idToken.isBlank()) {
      return null;
    }
    try {
      String[] parts = idToken.split("\\.");
      if (parts.length < 2) {
        return null;
      }
      byte[] decodedBytes = Base64.getUrlDecoder().decode(parts[1]);
      String payloadJson = new String(decodedBytes, StandardCharsets.UTF_8);
      JsonNode node = jsonMapper.readTree(payloadJson);

      // Validação OIDC obrigatória (Core §3.1.3.7): iss, aud e exp
      String iss = node.path("iss").asString(null);
      if (iss == null || !VALID_GOOGLE_ISSUERS.contains(iss)) {
        log.warn("[GoogleOAuthAdapter] id_token rejeitado: issuer inválido ({})", iss);
        throw new DomainValidationException("Token de identidade do Google com emissor inválido.");
      }
      String aud = node.path("aud").asString(null);
      if (aud == null || !aud.equals(clientId)) {
        log.warn("[GoogleOAuthAdapter] id_token rejeitado: audience divergente.");
        throw new DomainValidationException("Token de identidade do Google não pertence a esta aplicação.");
      }
      long expEpochSeconds = node.path("exp").asLong(0L);
      if (expEpochSeconds <= 0L || Instant.ofEpochSecond(expEpochSeconds).isBefore(Instant.now())) {
        log.warn("[GoogleOAuthAdapter] id_token rejeitado: expirado (exp={}).", expEpochSeconds);
        throw new DomainValidationException("Token de identidade do Google expirado.");
      }

      String email = node.path("email").asString(null);
      String name = node.path("name").asString(null);
      String picture = node.path("picture").asString(null);

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
      HttpCallResult response = restClient.get()
          .uri(GOOGLE_USERINFO_URL)
          .header(HttpHeaders.AUTHORIZATION, "Bearer " + googleAccessToken)
          .exchange((req, res) -> new HttpCallResult(
              res.getStatusCode().value(),
              new String(res.getBody().readAllBytes(), StandardCharsets.UTF_8)));

      if (response == null || response.statusCode() != 200) {
        log.error("[GoogleOAuthAdapter] Falha ao obter dados do usuário no Google. Status: {}, Body: {}",
            response != null ? response.statusCode() : -1, response != null ? response.body() : "<vazio>");
        throw new DomainValidationException("Falha ao recuperar informações da conta Google.");
      }

      JsonNode node = jsonMapper.readTree(response.body());
      String email = node.path("email").asString(null);
      String name = node.path("name").asString(null);
      String picture = node.path("picture").asString(null);

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
    return "true".equalsIgnoreCase(verifiedNode.asString(""));
  }
}
