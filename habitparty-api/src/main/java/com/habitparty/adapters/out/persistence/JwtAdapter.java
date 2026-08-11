package com.habitparty.adapters.out.persistence;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

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
  @Value("${api.security.token.secret}") // Chave secreta
  private String secret;

  @Override
  public String generateToken(User user) {
    try {
      Algorithm algorithm = Algorithm.HMAC256(secret);
      return JWT.create()
          .withIssuer("habitparty-api")
          .withSubject(user.getId().toString()) // O Dono do crachá
          .withClaim("role", user.getRole().name()) // Penduramos o cargo no crachá!
          .withExpiresAt(genExpirationDate()) // Tempo de validade
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
                    .getSubject(); // Devolve o ID se for válido
        } catch (JWTVerificationException exception) {
            return ""; // Se for falso ou expirado, devolve vazio e o Spring bloqueia
        }
    }

  private Instant genExpirationDate() {
    // Token expira em 2 horas
    return LocalDateTime.now().plusHours(2).toInstant(ZoneOffset.of("-03:00"));
  }
}
