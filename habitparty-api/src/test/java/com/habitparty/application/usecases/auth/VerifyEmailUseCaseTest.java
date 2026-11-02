package com.habitparty.application.usecases.auth;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.ports.UserTokenRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.UserToken;
import com.habitparty.core.domain.enums.SubscriptionStatus;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserRole;
import com.habitparty.core.domain.enums.UserTokenType;
import com.habitparty.core.exceptions.DomainValidationException;

@ExtendWith(MockitoExtension.class)
class VerifyEmailUseCaseTest {

  @Mock
  private UserTokenRepository tokenRepository;

  @Mock
  private UserRepository userRepository;

  @InjectMocks
  private VerifyEmailUseCase verifyEmailUseCase;

  private UUID userId;
  private User unverifiedUser;

  @BeforeEach
  void setUp() {
    userId = UUID.randomUUID();
    unverifiedUser = new User(
        userId,
        UserRole.USER,
        false,
        false,
        null,
        null,
        SubscriptionStatus.FREE,
        null,
        "Aventureiro Novo",
        "aventureiro_novo",
        "novo@habitparty.com",
        "hashed_pwd",
        false,
        null,
        BigDecimal.ZERO,
        BigDecimal.ZERO,
        LocalDate.of(2000, 1, 1),
        null,
        UserGender.PREFER_NOT_TO_SAY,
        0,
        0,
        0,
        LocalDateTime.now()
    );
  }

  @Test
  @DisplayName("Deve confirmar o e-mail do usuário e marcar o token como usado")
  void shouldVerifyEmailSuccessfully() {
    String rawToken = "valid-raw-token-123";
    UserToken userToken = new UserToken(
        UUID.randomUUID(),
        userId,
        UserTokenType.EMAIL_VERIFICATION,
        UserToken.hashToken(rawToken),
        Instant.now().plus(24, ChronoUnit.HOURS),
        false
    );

    when(tokenRepository.findByTokenAndType(rawToken, UserTokenType.EMAIL_VERIFICATION))
        .thenReturn(Optional.of(userToken));
    when(userRepository.findById(userId)).thenReturn(Optional.of(unverifiedUser));
    when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

    User verified = verifyEmailUseCase.execute(rawToken);

    assertTrue(verified.isEmailVerified());
    assertNotNull(verified.getEmailVerifiedAt());
    assertTrue(userToken.isUsed());
    assertNotNull(userToken.getUsedAt());
    verify(userRepository).save(unverifiedUser);
    verify(tokenRepository).save(userToken);
  }

  @Test
  @DisplayName("Deve rejeitar token de verificação expirado")
  void shouldRejectExpiredToken() {
    String rawToken = "expired-token";
    UserToken expiredToken = new UserToken(
        UUID.randomUUID(),
        userId,
        UserTokenType.EMAIL_VERIFICATION,
        UserToken.hashToken(rawToken),
        Instant.now().minus(1, ChronoUnit.HOURS),
        false
    );

    when(tokenRepository.findByTokenAndType(rawToken, UserTokenType.EMAIL_VERIFICATION))
        .thenReturn(Optional.of(expiredToken));

    assertThrows(DomainValidationException.class, () -> verifyEmailUseCase.execute(rawToken));
    verify(userRepository, never()).save(any());
  }

  @Test
  @DisplayName("Deve permitir leitura idempotente caso o token já tenha sido utilizado e o e-mail já esteja verificado")
  void shouldReturnUserIdempotentlyWhenAlreadyVerified() {
    String rawToken = "already-used-token";
    unverifiedUser.verifyEmail();
    UserToken usedToken = new UserToken(
        UUID.randomUUID(),
        userId,
        UserTokenType.EMAIL_VERIFICATION,
        UserToken.hashToken(rawToken),
        Instant.now().plus(12, ChronoUnit.HOURS),
        true
    );

    when(tokenRepository.findByTokenAndType(rawToken, UserTokenType.EMAIL_VERIFICATION))
        .thenReturn(Optional.of(usedToken));
    when(userRepository.findById(userId)).thenReturn(Optional.of(unverifiedUser));

    User result = verifyEmailUseCase.execute(rawToken);

    assertTrue(result.isEmailVerified());
    verify(userRepository, never()).save(any());
  }
}
