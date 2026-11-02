package com.habitparty.application.usecases.auth;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.PasswordHasherPort;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.ports.UserTokenRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.UserToken;
import com.habitparty.core.domain.enums.UserTokenType;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class ResetPasswordUseCase {
  private final UserTokenRepository tokenRepository;
  private final UserRepository userRepository;
  private final PasswordHasherPort passwordHasher;

  public ResetPasswordUseCase(
      UserTokenRepository tokenRepository,
      UserRepository userRepository,
      PasswordHasherPort passwordHasher) {
    this.tokenRepository = tokenRepository;
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
  }

  @Transactional
  public void execute(String rawToken, String rawPassword) {
    if (rawToken == null || rawToken.isBlank()) {
      throw new DomainValidationException("Token de recuperação inválido ou expirado.");
    }

    UserToken token = tokenRepository.findByTokenAndType(rawToken.trim(), UserTokenType.PASSWORD_RESET)
        .orElseThrow(() -> new DomainValidationException("Token de recuperação inválido ou expirado."));

    if (!token.isValid()) {
      throw new DomainValidationException("Token de recuperação inválido ou expirado.");
    }

    if (rawPassword == null || rawPassword.length() < 8 || !rawPassword.matches(".*[A-Z].*") || !rawPassword.matches(".*[@$!%*?&#].*")) {
      throw new DomainValidationException("A nova senha deve conter pelo menos uma letra maiúscula e um caractere especial (@$!%*?&#).");
    }

    User user = userRepository.findById(token.getUserId())
        .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

    String newHashedPassword = passwordHasher.encode(rawPassword);
    user.updatePassword(newHashedPassword);
    // Se o usuário redefiniu a senha clicando em um link enviado ao seu e-mail, confirma também a posse do e-mail
    user.verifyEmail();
    userRepository.save(user);

    token.markAsUsed();
    tokenRepository.save(token);
  }
}
