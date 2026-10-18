package com.habitparty.application.usecases.auth;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.habitparty.application.ports.OAuthIdentityProviderPort;
import com.habitparty.application.ports.PasswordHasherPort;
import com.habitparty.application.ports.RefreshTokenRepository;
import com.habitparty.application.ports.TokenPort;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.AuthTokens;
import com.habitparty.core.domain.entities.RefreshToken;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.auth.OAuthUserProfile;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserRole;
import com.habitparty.core.exceptions.DomainValidationException;

@ExtendWith(MockitoExtension.class)
class GoogleSignInUseCaseTest {

  @Mock
  private UserRepository userRepository;

  @Mock
  private PasswordHasherPort passwordHasher;

  @Mock
  private TokenPort tokenPort;

  @Mock
  private RefreshTokenRepository refreshTokenRepository;

  @Mock
  private OAuthIdentityProviderPort oAuthIdentityProviderPort;

  @InjectMocks
  private GoogleSignInUseCase googleSignInUseCase;

  private UUID userId;
  private User existingUser;

  @BeforeEach
  void setUp() {
    userId = UUID.randomUUID();
    existingUser = new User(
        userId,
        UserRole.USER,
        false,
        "John Doe",
        "johndoe",
        "john.doe@gmail.com",
        "hashed_pwd",
        BigDecimal.ZERO,
        BigDecimal.ZERO,
        LocalDate.of(2000, 1, 1),
        "https://avatar.url",
        UserGender.PREFER_NOT_TO_SAY,
        0,
        0,
        0,
        LocalDateTime.now()
    );
  }

  @Test
  @DisplayName("Deve autenticar com sucesso usuário existente com Google OAuth")
  void testGoogleSignInExistingUser() {
    String authCode = "valid_oauth_code";
    OAuthUserProfile profile = new OAuthUserProfile("john.doe@gmail.com", "John Doe", "https://avatar.url");

    when(oAuthIdentityProviderPort.fetchUserProfile(authCode)).thenReturn(profile);
    when(userRepository.findByEmail("john.doe@gmail.com")).thenReturn(Optional.of(existingUser));
    when(refreshTokenRepository.countActiveByUserId(userId)).thenReturn(1);
    when(tokenPort.generateToken(existingUser)).thenReturn("habitparty_jwt_access_token");

    AuthTokens tokens = googleSignInUseCase.execute(authCode);

    assertNotNull(tokens);
    assertEquals("habitparty_jwt_access_token", tokens.accessToken());
    assertNotNull(tokens.refreshToken());

    verify(refreshTokenRepository, never()).revokeOldestSession(any());
    verify(refreshTokenRepository).save(any(RefreshToken.class));
    verify(userRepository, never()).save(any());
  }

  @Test
  @DisplayName("Deve provisionar novo usuário automaticamente caso não exista cadastro prévio")
  void testGoogleSignInNewUserCreatesAccount() {
    String authCode = "oauth_code_new_user";
    OAuthUserProfile profile = new OAuthUserProfile("newbie@gmail.com", "Newbie Hero", "https://newbie.png");

    when(oAuthIdentityProviderPort.fetchUserProfile(authCode)).thenReturn(profile);
    when(userRepository.findByEmail("newbie@gmail.com")).thenReturn(Optional.empty());
    when(userRepository.findByUsername("newbie")).thenReturn(Optional.empty());
    when(passwordHasher.encode(any())).thenReturn("hashed_random_pwd");
    when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
    when(refreshTokenRepository.countActiveByUserId(any())).thenReturn(0);
    when(tokenPort.generateToken(any(User.class))).thenReturn("access_token_123");

    AuthTokens tokens = googleSignInUseCase.execute(authCode);

    assertNotNull(tokens);
    assertEquals("access_token_123", tokens.accessToken());

    ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
    verify(userRepository).save(captor.capture());
    assertEquals("newbie@gmail.com", captor.getValue().getEmail());
    assertEquals("newbie", captor.getValue().getUsername());
    assertEquals("Newbie Hero", captor.getValue().getFullName());
    assertEquals("https://newbie.png", captor.getValue().getProfilePhotoUrl().orElse(null));
  }

  @Test
  @DisplayName("Deve resolver conflitos incrementando sufixo numérico quando o username já estiver em uso")
  void testGoogleSignInResolvesUsernameCollision() {
    String authCode = "oauth_collision";
    OAuthUserProfile profile = new OAuthUserProfile("clash@gmail.com", "Clash Hero", null);

    User otherUser = new User(UUID.randomUUID(), UserRole.USER, false, "Existing Clash", "clash",
        "other@gmail.com", "pwd", BigDecimal.ZERO, BigDecimal.ZERO, LocalDate.now(), null,
        UserGender.MALE, 0, 0, 0, LocalDateTime.now());

    when(oAuthIdentityProviderPort.fetchUserProfile(authCode)).thenReturn(profile);
    when(userRepository.findByEmail("clash@gmail.com")).thenReturn(Optional.empty());
    when(userRepository.findByUsername("clash")).thenReturn(Optional.of(otherUser));
    when(userRepository.findByUsername("clash_1")).thenReturn(Optional.empty());
    when(passwordHasher.encode(any())).thenReturn("hashed_pwd");
    when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
    when(refreshTokenRepository.countActiveByUserId(any())).thenReturn(0);
    when(tokenPort.generateToken(any())).thenReturn("jwt_token");

    googleSignInUseCase.execute(authCode);

    ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
    verify(userRepository).save(captor.capture());
    assertEquals("clash_1", captor.getValue().getUsername());
  }

  @Test
  @DisplayName("Deve revogar a sessão mais antiga quando o usuário atinge o limite máximo de sessões ativas (3)")
  void testGoogleSignInRevokesOldestSessionWhenLimitReached() {
    String authCode = "oauth_code";
    OAuthUserProfile profile = new OAuthUserProfile("john.doe@gmail.com", "John Doe", null);

    when(oAuthIdentityProviderPort.fetchUserProfile(authCode)).thenReturn(profile);
    when(userRepository.findByEmail("john.doe@gmail.com")).thenReturn(Optional.of(existingUser));
    when(refreshTokenRepository.countActiveByUserId(userId)).thenReturn(3);
    when(tokenPort.generateToken(existingUser)).thenReturn("jwt");

    googleSignInUseCase.execute(authCode);

    verify(refreshTokenRepository, times(1)).revokeOldestSession(userId);
    verify(refreshTokenRepository).save(any(RefreshToken.class));
  }

  @Test
  @DisplayName("Deve lançar DomainValidationException caso o perfil Google retorne e-mail nulo ou vazio")
  void testGoogleSignInThrowsExceptionWhenEmailMissing() {
    String authCode = "invalid_profile";
    OAuthUserProfile emptyEmailProfile = new OAuthUserProfile("", "No Email", null);

    when(oAuthIdentityProviderPort.fetchUserProfile(authCode)).thenReturn(emptyEmailProfile);

    assertThrows(DomainValidationException.class, () -> googleSignInUseCase.execute(authCode));
    verifyNoInteractions(userRepository);
    verifyNoInteractions(refreshTokenRepository);
  }
}
