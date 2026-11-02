package com.habitparty.application.usecases.auth;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.habitparty.application.ports.EmailDispatchLogRepository;
import com.habitparty.application.ports.EmailSenderPort;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.ports.UserTokenRepository;
import com.habitparty.core.domain.entities.EmailDispatchLog;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.UserToken;
import com.habitparty.core.domain.enums.EmailDispatchStatus;
import com.habitparty.core.domain.enums.EmailType;
import com.habitparty.core.domain.enums.UserTokenType;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class SendEmailVerificationUseCase {
  private static final Logger log = LoggerFactory.getLogger(SendEmailVerificationUseCase.class);

  private final UserRepository userRepository;
  private final UserTokenRepository tokenRepository;
  private final EmailSenderPort emailSender;
  private final EmailDispatchLogRepository emailLogPort;
  private final String frontendUrl;

  public SendEmailVerificationUseCase(
      UserRepository userRepository,
      UserTokenRepository tokenRepository,
      EmailSenderPort emailSender,
      EmailDispatchLogRepository emailLogPort,
      @Value("${app.frontend-url:${APP_FRONTEND_URL:http://localhost:3000}}") String frontendUrl) {
    this.userRepository = userRepository;
    this.tokenRepository = tokenRepository;
    this.emailSender = emailSender;
    this.emailLogPort = emailLogPort;
    this.frontendUrl = frontendUrl.endsWith("/") ? frontendUrl.substring(0, frontendUrl.length() - 1) : frontendUrl;
  }

  public void executeForUser(User user) {
    if (user == null || user.isEmailVerified()) {
      return;
    }

    tokenRepository.invalidateActiveTokensByUserIdAndType(user.getId(), UserTokenType.EMAIL_VERIFICATION);

    String rawToken = UUID.randomUUID().toString();
    String hashedToken = UserToken.hashToken(rawToken);

    UserToken token = new UserToken(
        UUID.randomUUID(),
        user.getId(),
        UserTokenType.EMAIL_VERIFICATION,
        hashedToken,
        Instant.now().plus(24, ChronoUnit.HOURS),
        false
    );

    tokenRepository.save(token);

    String verificationLink = frontendUrl + "/verify-email?token=" + rawToken;
    String userName = (user.getFullName() != null && !user.getFullName().isBlank())
        ? user.getFullName()
        : user.getUsername();

    boolean success = emailSender.sendEmailVerificationEmail(user.getEmail(), userName, verificationLink);

    emailLogPort.save(new EmailDispatchLog(
        UUID.randomUUID(),
        user.getId(),
        null,
        EmailType.EMAIL_VERIFICATION,
        user.getEmail(),
        "Confirme seu e-mail - HabitParty",
        success ? EmailDispatchStatus.SENT : EmailDispatchStatus.FAILED,
        success ? null : "Falha ao enviar e-mail de verificação via Resend",
        LocalDateTime.now()
    ));
  }

  public void executeByUserId(UUID userId) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

    if (user.isEmailVerified()) {
      throw new DomainValidationException("O seu e-mail já foi confirmado.");
    }

    executeForUser(user);
  }
}
