package com.habitparty.application.usecases.auth;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import com.habitparty.application.ports.EmailDispatchLogRepository;
import com.habitparty.application.ports.EmailSenderPort;
import com.habitparty.application.ports.PasswordResetTokenRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.EmailDispatchLog;
import com.habitparty.core.domain.entities.PasswordResetToken;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.enums.EmailDispatchStatus;
import com.habitparty.core.domain.enums.EmailType;

@Service
@Transactional
public class RequestPasswordResetUseCase {
  private static final Logger log = LoggerFactory.getLogger(RequestPasswordResetUseCase.class);

  private final UserRepository userRepository;
  private final PasswordResetTokenRepository tokenRepository;
  private final EmailSenderPort emailSender;
  private final EmailDispatchLogRepository emailLogPort;
  private final String frontendUrl;

  public RequestPasswordResetUseCase(
      UserRepository userRepository,
      PasswordResetTokenRepository tokenRepository,
      EmailSenderPort emailSender,
      EmailDispatchLogRepository emailLogPort,
      @Value("${app.frontend-url:${APP_FRONTEND_URL:http://localhost:3000}}") String frontendUrl) {
    this.userRepository = userRepository;
    this.tokenRepository = tokenRepository;
    this.emailSender = emailSender;
    this.emailLogPort = emailLogPort;
    this.frontendUrl = frontendUrl.endsWith("/") ? frontendUrl.substring(0, frontendUrl.length() - 1) : frontendUrl;
  }

  public void execute(String email) {
    if (email == null) {
      return;
    }
    var userOptional = userRepository.findByEmail(email.trim().toLowerCase());
    if (userOptional.isEmpty()) {
      log.info("[RequestPasswordReset] E-mail não encontrado no banco: {}", email);
      return;
    }

    User user = userOptional.get();

    tokenRepository.invalidateActiveTokensByUserId(user.getId());

    String tokenValue = UUID.randomUUID().toString();
    PasswordResetToken token = new PasswordResetToken(
        UUID.randomUUID(),
        user.getId(),
        tokenValue,
        Instant.now().plus(15, ChronoUnit.MINUTES),
        false
    );

    tokenRepository.save(token);

    String resetLink = frontendUrl + "/reset-password?token=" + tokenValue;
    boolean success = emailSender.sendPasswordResetEmail(user.getEmail(), resetLink);

    emailLogPort.save(new EmailDispatchLog(
        UUID.randomUUID(),
        user.getId(),
        null,
        EmailType.PASSWORD_RESET,
        user.getEmail(),
        "Recuperação de Senha - HabitParty",
        success ? EmailDispatchStatus.SENT : EmailDispatchStatus.FAILED,
        success ? null : "Falha ao enviar e-mail via Resend",
        LocalDateTime.now()
    ));
  }
}
