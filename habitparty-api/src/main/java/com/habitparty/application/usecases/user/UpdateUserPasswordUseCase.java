package com.habitparty.application.usecases.user;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.PasswordHasherPort;
import com.habitparty.application.ports.RefreshTokenRepository;
import com.habitparty.application.ports.TokenPort;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.usecases.auth.AuthSessionIssuer;
import com.habitparty.core.domain.entities.AuthTokens;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
@Transactional
public class UpdateUserPasswordUseCase {
  private final UserRepository port;
  private final PasswordHasherPort passwordHasher;
  private final RefreshTokenRepository refreshTokenRepository;
  private final TokenPort tokenPort;

  public UpdateUserPasswordUseCase(UserRepository port, PasswordHasherPort passwordHasher) {
    this(port, passwordHasher, null, null);
  }

  public UpdateUserPasswordUseCase(
      UserRepository port,
      PasswordHasherPort passwordHasher,
      @Nullable RefreshTokenRepository refreshTokenRepository) {
    this(port, passwordHasher, refreshTokenRepository, null);
  }

  @Autowired
  public UpdateUserPasswordUseCase(
      UserRepository port,
      PasswordHasherPort passwordHasher,
      @Nullable RefreshTokenRepository refreshTokenRepository,
      @Nullable TokenPort tokenPort) {
    this.port = port;
    this.passwordHasher = passwordHasher;
    this.refreshTokenRepository = refreshTokenRepository;
    this.tokenPort = tokenPort;
  }

  public void execute(UUID userId, String currentPassword, String newPassword) {
    executeAndRotateSession(userId, currentPassword, newPassword);
  }

  /**
   * Atualiza a senha, revoga todas as sessões antigas (desconectando outros dispositivos)
   * e emite um novo par de tokens para manter a sessão atual autenticada (padrão OWASP ASVS).
   */
  public AuthTokens executeAndRotateSession(UUID userId, String currentPassword, String newPassword) {
    User user = port.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

    // Ação crítica condicionada à verificação de e-mail
    user.validateEmailVerified("alterar sua senha");

    if (!user.hasPassword() || user.getPassword() == null || user.getPassword().isBlank()) {
      throw new DomainValidationException(
          "Esta conta ainda não possui uma senha cadastrada. Solicite um link de definição de senha por e-mail.");
    }

    // 1. Verifica se a senha atual informada bate com o hash do banco
    if (!passwordHasher.matches(currentPassword, user.getPassword())) {
      throw new DomainValidationException("A senha atual está incorreta.");
    }

    // 2. Cria o Hash da nova senha
    String newHash = passwordHasher.encode(newPassword);

    // 3. Atualiza no domínio, salva e revoga todas as sessões anteriores
    user.updatePassword(newHash);
    User savedUser = port.save(user);
    if (refreshTokenRepository != null) {
      refreshTokenRepository.revokeAllByUserId(userId);
      if (tokenPort != null) {
        return AuthSessionIssuer.issueSession(savedUser != null ? savedUser : user, tokenPort, refreshTokenRepository);
      }
    }
    return null;
  }
}
