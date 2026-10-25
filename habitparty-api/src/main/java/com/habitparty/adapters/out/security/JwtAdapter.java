package com.habitparty.adapters.out.security;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTCreationException;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.habitparty.application.ports.TokenPort;
import com.habitparty.core.domain.entities.User;

@Component
public class JwtAdapter implements TokenPort {
  @Value("${api.security.token.secret}")
  private String secret;

  @Override
  public String generateToken(User user) {
    try {
      Algorithm algorithm = Algorithm.HMAC256(secret);
      return JWT.create()
          .withIssuer("habitparty-api")
          .withSubject(user.getId().toString())
          .withClaim("role", user.getRole().name())
          .withExpiresAt(genExpirationDate())
          .sign(algorithm);
    } catch (JWTCreationException exception) {
      throw new RuntimeException("Erro ao gerar token", exception);
    }
  }

  @Override
  public String validateTokenAndGetUserId(String token) {
    try {
      Algorithm algorithm = Algorithm.HMAC256(secret);
      return JWT.require(algorithm)
          .withIssuer("habitparty-api")
          .build()
          .verify(token)
          .getSubject();
    } catch (JWTVerificationException exception) {
      return "";
    }
  }

  @Override
  public java.util.Optional<TokenPayload> validateToken(String token) {
    try {
      Algorithm algorithm = Algorithm.HMAC256(secret);
      var jwt = JWT.require(algorithm)
          .withIssuer("habitparty-api")
          .build()
          .verify(token);
      java.util.UUID userId = java.util.UUID.fromString(jwt.getSubject());
      String role = jwt.getClaim("role").asString();
      return java.util.Optional.of(new TokenPayload(userId, role != null ? role : "USER"));
    } catch (Exception exception) {
      return java.util.Optional.empty();
    }
  }

  private Instant genExpirationDate() {
    return Instant.now().plus(2, ChronoUnit.HOURS);
  }
}
