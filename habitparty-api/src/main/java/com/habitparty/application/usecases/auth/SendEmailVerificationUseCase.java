package com.habitparty.application.usecases.auth;

import java.time.Duration;
import java.util.UUID;

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
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class SendEmailVerificationUseCase {
  private static final Duration EMAIL_VERIFICATION_TTL = Duration.ofHours(24);

  private final UserRepository userRepository;
  private final UserTokenRepository tokenRepository;
  private final EmailSenderPort emailSender;
  private final EmailDispatchLogRepository emailLogPort;
  private final String frontendUrl;
  private AsyncAuthEmailDispatcher asyncEmailDispatcher;
  private TransactionOperations transactionOperations;

  @Autowired
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

  public void executeForUser(User user) {
    if (user == null || user.isEmailVerified()) {
      return;
    }

    String rawToken = EmailTokenDispatchService.issueHashedToken(
        user.getId(),
        UserTokenType.EMAIL_VERIFICATION,
        EMAIL_VERIFICATION_TTL,
        tokenRepository,
        transactionOperations);

    String verificationLink = frontendUrl + "/verify-email?token=" + rawToken;
    String userName = (user.getFullName() != null && !user.getFullName().isBlank())
        ? user.getFullName()
        : user.getUsername();

    EmailTokenDispatchService.dispatchOrSendSync(
        user.getId(),
        user.getEmail(),
        EmailType.EMAIL_VERIFICATION,
        "Confirme seu e-mail - HabitParty",
        "Falha ao enviar e-mail de verificação via Resend",
        asyncEmailDispatcher != null
            ? () -> asyncEmailDispatcher.dispatchEmailVerification(user.getId(), user.getEmail(), userName, verificationLink)
            : null,
        () -> emailSender.sendEmailVerificationEmail(user.getEmail(), userName, verificationLink),
        emailLogPort);
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
