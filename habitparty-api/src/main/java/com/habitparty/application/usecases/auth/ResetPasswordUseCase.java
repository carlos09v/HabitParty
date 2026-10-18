package com.habitparty.application.usecases.auth;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.PasswordHasherPort;
import com.habitparty.application.ports.PasswordResetTokenRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.PasswordResetToken;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
@Transactional
public class ResetPasswordUseCase {
  private final PasswordResetTokenRepository tokenRepository;
  private final UserRepository userRepository;
  private final PasswordHasherPort passwordHasher;

  public ResetPasswordUseCase(
      PasswordResetTokenRepository tokenRepository,
      UserRepository userRepository,
      PasswordHasherPort passwordHasher) {
    this.tokenRepository = tokenRepository;
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
  }

  public void execute(String rawToken, String rawPassword) {
    PasswordResetToken token = tokenRepository.findByToken(rawToken.trim())
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
    userRepository.save(user);

    token.markAsUsed();
    tokenRepository.save(token);
  }
}
