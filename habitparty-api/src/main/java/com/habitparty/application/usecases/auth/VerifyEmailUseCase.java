package com.habitparty.application.usecases.auth;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.ports.UserTokenRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.UserToken;
import com.habitparty.core.domain.enums.UserTokenType;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class VerifyEmailUseCase {
  private final UserTokenRepository tokenRepository;
  private final UserRepository userRepository;

  public VerifyEmailUseCase(
      UserTokenRepository tokenRepository,
      UserRepository userRepository) {
    this.tokenRepository = tokenRepository;
    this.userRepository = userRepository;
  }

  @Transactional
  public User execute(String rawToken) {
    if (rawToken == null || rawToken.isBlank()) {
      throw new DomainValidationException("Token de verificação ausente ou inválido.");
    }

    UserToken token = tokenRepository.findByTokenAndType(rawToken.trim(), UserTokenType.EMAIL_VERIFICATION)
        .orElseThrow(() -> new DomainValidationException("Link de verificação inválido ou expirado."));

    if (token.isExpired()) {
      throw new DomainValidationException("Link de verificação inválido ou expirado.");
    }

    User user = userRepository.findById(token.getUserId())
        .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

    if (token.isUsed()) {
      if (user.isEmailVerified()) {
        return user;
      }
      throw new DomainValidationException("Link de verificação inválido ou expirado.");
    }

    user.verifyEmail();
    User savedUser = userRepository.save(user);

    token.markAsUsed();
    tokenRepository.save(token);

    return savedUser;
  }
}
