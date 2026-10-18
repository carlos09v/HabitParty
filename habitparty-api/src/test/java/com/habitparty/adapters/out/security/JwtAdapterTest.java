package com.habitparty.adapters.out.security;

import static org.junit.jupiter.api.Assertions.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import com.habitparty.application.ports.TokenPort.TokenPayload;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserRole;

class JwtAdapterTest {

  private JwtAdapter jwtAdapter;
  private static final String SECRET = "test-jwt-secret-very-long-enough-for-hmac256-signing-test-key-32-chars";

  @BeforeEach
  void setUp() {
    jwtAdapter = new JwtAdapter();
    ReflectionTestUtils.setField(jwtAdapter, "secret", SECRET);
  }

  @Test
  @DisplayName("Deve gerar token JWT e validar payload em memória contendo userId e role")
  void testGenerateAndValidateToken() {
    UUID userId = UUID.randomUUID();
    User user = new User(
        userId,
        UserRole.ADMIN,
        false,
        "Admin User",
        "admin",
        "admin@habitparty.com",
        "pwd",
        BigDecimal.ZERO,
        BigDecimal.ZERO,
        LocalDate.of(1990, 1, 1),
        null,
        UserGender.NON_BINARY,
        0, 0, 0,
        LocalDateTime.now()
    );

    String token = jwtAdapter.generateToken(user);
    assertNotNull(token);
    assertFalse(token.isBlank());

    Optional<TokenPayload> payloadOpt = jwtAdapter.validateToken(token);
    assertTrue(payloadOpt.isPresent());

    TokenPayload payload = payloadOpt.get();
    assertEquals(userId, payload.userId());
    assertEquals("ADMIN", payload.role());

    String retrievedUserId = jwtAdapter.validateTokenAndGetUserId(token);
    assertEquals(userId.toString(), retrievedUserId);
  }

  @Test
  @DisplayName("Deve retornar Optional.empty() ao validar token com assinatura inválida ou malformado")
  void testValidateInvalidTokenReturnsEmpty() {
    Optional<TokenPayload> invalidToken = jwtAdapter.validateToken("invalid.jwt.token");
    assertTrue(invalidToken.isEmpty());

    String userIdResult = jwtAdapter.validateTokenAndGetUserId("invalid.jwt.token");
    assertEquals("", userIdResult);
  }
}
