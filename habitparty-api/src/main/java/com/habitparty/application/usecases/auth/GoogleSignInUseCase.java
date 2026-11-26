package com.habitparty.application.usecases.auth;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Locale;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.habitparty.application.ports.OAuthIdentityProviderPort;
import com.habitparty.application.ports.PasswordHasherPort;
import com.habitparty.application.ports.RefreshTokenRepository;
import com.habitparty.application.ports.TokenPort;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.AuthTokens;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.auth.OAuthUserProfile;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.exceptions.DomainValidationException;

@Service
public class GoogleSignInUseCase {
  private final UserRepository userRepository;
  private final PasswordHasherPort passwordHasher;
  private final TokenPort tokenPort;
  private final RefreshTokenRepository refreshTokenRepository;
  private final OAuthIdentityProviderPort oAuthIdentityProviderPort;
  private final Clock clock;

  public GoogleSignInUseCase(
      UserRepository userRepository,
      PasswordHasherPort passwordHasher,
      TokenPort tokenPort,
      RefreshTokenRepository refreshTokenRepository,
      OAuthIdentityProviderPort oAuthIdentityProviderPort) {
    this(
        userRepository,
        passwordHasher,
        tokenPort,
        refreshTokenRepository,
        oAuthIdentityProviderPort,
        Clock.system(ZoneId.of(User.DEFAULT_TIMEZONE)));
  }

  @Autowired
  public GoogleSignInUseCase(
      UserRepository userRepository,
      PasswordHasherPort passwordHasher,
      TokenPort tokenPort,
      RefreshTokenRepository refreshTokenRepository,
      OAuthIdentityProviderPort oAuthIdentityProviderPort,
      Clock clock) {
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
    this.tokenPort = tokenPort;
    this.refreshTokenRepository = refreshTokenRepository;
    this.oAuthIdentityProviderPort = oAuthIdentityProviderPort;
    this.clock = clock != null ? clock : Clock.system(ZoneId.of(User.DEFAULT_TIMEZONE));
  }

  public AuthTokens execute(String code) {
    return execute(code, null);
  }

  public AuthTokens execute(String code, String timezone) {
    // 1. Obtém as informações do perfil do usuário via porta de identidade OAuth
    OAuthUserProfile profile = oAuthIdentityProviderPort.fetchUserProfile(code);

    if (profile.email() == null || profile.email().isBlank()) {
      throw new DomainValidationException("Não foi possível obter o e-mail da sua conta Google.");
    }

    String emailNormalized = profile.email().trim().toLowerCase(Locale.ROOT);

    // 2. Localiza ou cria o usuário na base de dados
    User user = userRepository.findByEmail(emailNormalized)
        .map(existing -> {
          boolean needsSave = false;
          if (!existing.isEmailVerified()) {
            // Anti-pre-hijacking: uma conta previamente cadastrada sem verificação de e-mail pode ter sido
            // criada por um atacante com senha própria; ao autenticar via Google verificado, invalidamos
            // a senha local não verificada e revogamos eventuais sessões antigas.
            existing.verifyEmail();
            existing.updatePassword(passwordHasher.encode(UUID.randomUUID().toString()));
            existing.setHasPassword(false);
            refreshTokenRepository.revokeAllByUserId(existing.getId());
            needsSave = true;
          }
          // Limpa data de nascimento fictícia legada (2000-01-01) para permitir preenchimento pelo usuário
          if (LocalDate.of(2000, 1, 1).equals(existing.getBirthDate())) {
            existing.setBirthDate(null);
            needsSave = true;
          }
          return needsSave ? userRepository.save(existing) : existing;
        })
        .orElseGet(() -> createGoogleUser(profile, emailNormalized, timezone));

    // 3. Limita sessões ativas e emite Access Token + Refresh Token
    return AuthSessionIssuer.issueSession(user, tokenPort, refreshTokenRepository);
  }

  private User createGoogleUser(OAuthUserProfile profile, String emailNormalized, String timezone) {
    String baseUsername = emailNormalized.split("@")[0].replaceAll("[^a-z0-9_]", "");
    if (baseUsername.isBlank()) {
      baseUsername = "user";
    }
    if (baseUsername.length() > 20) {
      baseUsername = baseUsername.substring(0, 20);
    }

    String uniqueUsername = baseUsername;
    int counter = 1;
    while (userRepository.findByUsername(uniqueUsername).isPresent()) {
      uniqueUsername = baseUsername + "_" + counter++;
    }

    String fullName = (profile.name() != null && !profile.name().isBlank())
        ? profile.name().trim()
        : uniqueUsername;

    User newUser = User.createNew(
        fullName,
        uniqueUsername,
        emailNormalized,
        passwordHasher.encode(UUID.randomUUID().toString()),
        false,
        true, // Conta Google já tem e-mail verificado pelo provedor OAuth
        null,
        profile.picture(),
        UserGender.PREFER_NOT_TO_SAY,
        timezone,
        clock);

    return userRepository.save(newUser);
  }
}
