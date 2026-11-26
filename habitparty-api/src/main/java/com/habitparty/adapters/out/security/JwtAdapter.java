package com.habitparty.adapters.out.security;

import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTVerifier;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTCreationException;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.habitparty.application.ports.TokenPort;
import com.habitparty.core.domain.entities.User;

import jakarta.annotation.PostConstruct;

@Component
public class JwtAdapter implements TokenPort {
  private static final Logger log = LoggerFactory.getLogger(JwtAdapter.class);
  private static final String ISSUER = "habitparty-api";
  private static final int MIN_SECRET_BYTES = 32;

  @Value("${api.security.token.secret}")
  private String secret;

  private final Clock clock;
  private volatile CachedCrypto cachedCrypto;

  private record CachedCrypto(String secretSnapshot, Algorithm algorithm, JWTVerifier verifier) {}

  public JwtAdapter() {
    this.clock = Clock.systemUTC();
  }

  @Autowired
  public JwtAdapter(
      @Value("${api.security.token.secret}") String secret,
      @Autowired(required = false) Clock clock) {
    this.secret = secret;
    this.clock = clock != null ? clock : Clock.systemUTC();
  }

  @PostConstruct
  void initializeCrypto() {
    resolveCrypto();
  }

  private CachedCrypto resolveCrypto() {
    String currentSecret = this.secret;
    CachedCrypto current = this.cachedCrypto;
    if (current != null && Objects.equals(current.secretSnapshot(), currentSecret)) {
      return current;
    }
    if (currentSecret == null || currentSecret.isBlank()
        || currentSecret.getBytes(StandardCharsets.UTF_8).length < MIN_SECRET_BYTES) {
      throw new IllegalStateException(
          "JWT_SECRET inválido: deve possuir pelo menos " + MIN_SECRET_BYTES + " bytes para assinatura HMAC-SHA256.");
    }
    Algorithm algorithm = Algorithm.HMAC256(currentSecret);
    JWTVerifier verifier = JWT.require(algorithm)
        .withIssuer(ISSUER)
        .build();
    CachedCrypto fresh = new CachedCrypto(currentSecret, algorithm, verifier);
    this.cachedCrypto = fresh;
    return fresh;
  }

  @Override
  public String generateToken(User user) {
    try {
      CachedCrypto crypto = resolveCrypto();
      return JWT.create()
          .withIssuer(ISSUER)
          .withSubject(user.getId().toString())
          .withClaim("role", user.getRole().name())
          .withExpiresAt(genExpirationDate())
          .sign(crypto.algorithm());
    } catch (JWTCreationException exception) {
      throw new RuntimeException("Erro ao gerar token", exception);
    }
  }

  @Override
  public Optional<TokenPayload> validateToken(String token) {
    JWTVerifier verifier = resolveCrypto().verifier();
    try {
      var jwt = verifier.verify(token);
      UUID userId = UUID.fromString(jwt.getSubject());
      String rawRole = jwt.getClaim("role").asString();
      String normalizedRole = (rawRole != null && !rawRole.isBlank()) ? rawRole.trim() : "USER";
      return Optional.of(new TokenPayload(userId, normalizedRole));
    } catch (JWTVerificationException | IllegalArgumentException exception) {
      return Optional.empty();
    } catch (Exception exception) {
      log.warn("[JwtAdapter] Erro inesperado ao validar token JWT: {}", exception.getMessage());
      return Optional.empty();
    }
  }

  private Instant genExpirationDate() {
    return Instant.now(clock).plus(2, ChronoUnit.HOURS);
  }
}
