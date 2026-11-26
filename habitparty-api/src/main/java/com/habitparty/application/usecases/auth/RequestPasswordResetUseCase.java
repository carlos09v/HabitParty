package com.habitparty.application.usecases.auth;

import java.time.Duration;
import java.util.Locale;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionOperations;
import org.springframework.transaction.support.TransactionTemplate;

import com.habitparty.application.ports.EmailDispatchLogRepository;
import com.habitparty.application.ports.EmailSenderPort;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.ports.UserTokenRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.enums.EmailType;
import com.habitparty.core.domain.enums.UserTokenType;

@Service
public class RequestPasswordResetUseCase {
  private static final Logger log = LoggerFactory.getLogger(RequestPasswordResetUseCase.class);
  private static final Duration PASSWORD_RESET_TTL = Duration.ofMinutes(15);

  private final UserRepository userRepository;
  private final UserTokenRepository tokenRepository;
  private final EmailSenderPort emailSender;
  private final EmailDispatchLogRepository emailLogPort;
  private final String frontendUrl;
  private AsyncAuthEmailDispatcher asyncEmailDispatcher;
  private TransactionOperations transactionOperations;

  @Autowired
  public RequestPasswordResetUseCase(
      UserRepository userRepository,
      UserTokenRepository tokenRepository,
      EmailSenderPort emailSender,
      EmailDispatchLogRepository emailLogPort,
      @Value("${app.frontend-url:${APP_FRONTEND_URL:http://localhost:3000}}") String frontendUrl) {
    this.userRepository = userRepository;
    this.tokenRepository = tokenRepository;
    this.emailSender = emailSender;
    this.emailLogPort = emailLogPort;
    this.frontendUrl = EmailTokenDispatchService.normalizeFrontendUrl(frontendUrl);
  }

  @Autowired(required = false)
  public void setAsyncEmailDispatcher(@Nullable AsyncAuthEmailDispatcher asyncEmailDispatcher) {
    this.asyncEmailDispatcher = asyncEmailDispatcher;
  }

  @Autowired(required = false)
  public void setTransactionManager(@Nullable PlatformTransactionManager transactionManager) {
    this.transactionOperations = transactionManager != null
        ? new TransactionTemplate(transactionManager)
        : null;
  }

  public void execute(String email) {
    if (email == null || email.isBlank()) {
      return;
    }
    var userOptional = userRepository.findByEmail(email.trim().toLowerCase(Locale.ROOT));
    if (userOptional.isEmpty()) {
      log.debug("[RequestPasswordReset] Solicitação ignorada para conta inexistente.");
      return;
    }

    User user = userOptional.get();
    String rawTokenValue = EmailTokenDispatchService.issueHashedToken(
        user.getId(),
        UserTokenType.PASSWORD_RESET,
        PASSWORD_RESET_TTL,
        tokenRepository,
        transactionOperations);

    String resetLink = frontendUrl + "/reset-password?token=" + rawTokenValue;
    EmailTokenDispatchService.dispatchOrSendSync(
        user.getId(),
        user.getEmail(),
        EmailType.PASSWORD_RESET,
        "Recuperação de Senha - HabitParty",
        "Falha ao enviar e-mail via Resend",
        asyncEmailDispatcher != null
            ? () -> asyncEmailDispatcher.dispatchPasswordReset(user.getId(), user.getEmail(), resetLink)
            : null,
        () -> emailSender.sendPasswordResetEmail(user.getEmail(), resetLink),
        emailLogPort);
  }
}
