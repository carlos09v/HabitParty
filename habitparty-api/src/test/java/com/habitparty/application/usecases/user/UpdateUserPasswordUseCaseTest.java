package com.habitparty.application.usecases.user;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.InOrder;

import com.habitparty.application.ports.PasswordHasherPort;
import com.habitparty.application.ports.RefreshTokenRepository;
import com.habitparty.application.ports.TokenPort;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.AuthTokens;
import com.habitparty.core.domain.entities.RefreshToken;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.UserStats;
import com.habitparty.core.domain.entities.UserSubscription;
import com.habitparty.core.domain.enums.UserRole;

class UpdateUserPasswordUseCaseTest {

  @Test
  @DisplayName("Alteração de senha deve revogar todas as sessões anteriores e emitir novo par de tokens para a sessão atual")
  void shouldRevokeOldSessionsAndIssueFreshSessionOnPasswordChange() {
    UUID userId = UUID.randomUUID();
    User user = new User(
        userId,
        UserRole.USER,
        "Ana Silva",
        "anasilva",
        "ana@habitparty.test",
        "old-hash",
        true,
        null,
        LocalDate.of(1995, 4, 12),
        null,
        null,
        LocalDateTime.now(),
        UserStats.createInitial(userId),
        new UserSubscription(userId, false, false, null, null, null, null, LocalDateTime.now()));

    UserRepository userRepo = mock(UserRepository.class);
    PasswordHasherPort hasher = mock(PasswordHasherPort.class);
    RefreshTokenRepository refreshRepo = mock(RefreshTokenRepository.class);
    TokenPort tokenPort = mock(TokenPort.class);

    when(userRepo.findById(userId)).thenReturn(Optional.of(user));
    when(hasher.matches("OldPass@1", "old-hash")).thenReturn(true);
    when(hasher.encode("NewPass@2")).thenReturn("new-hash");
    when(userRepo.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
    when(refreshRepo.countActiveByUserId(userId)).thenReturn(0);
    when(tokenPort.generateToken(any(User.class))).thenReturn("fresh-jwt-token");

    UpdateUserPasswordUseCase useCase = new UpdateUserPasswordUseCase(
        userRepo, hasher, refreshRepo, tokenPort);

    AuthTokens tokens = useCase.executeAndRotateSession(userId, "OldPass@1", "NewPass@2");

    assertNotNull(tokens);
    assertEquals("fresh-jwt-token", tokens.accessToken());
    assertNotNull(tokens.refreshToken());
    assertEquals("new-hash", user.getPassword());

    InOrder order = inOrder(userRepo, refreshRepo, tokenPort);
    order.verify(userRepo).save(user);
    order.verify(refreshRepo).revokeAllByUserId(userId);
    order.verify(tokenPort).generateToken(user);
    order.verify(refreshRepo).save(any(RefreshToken.class));
  }
}
