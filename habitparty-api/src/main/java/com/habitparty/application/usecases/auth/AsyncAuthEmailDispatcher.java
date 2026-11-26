package com.habitparty.application.usecases.auth;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.Nullable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import com.habitparty.application.ports.EmailDispatchLogRepository;
import com.habitparty.application.ports.EmailSenderPort;
import com.habitparty.core.domain.entities.EmailDispatchLog;
import com.habitparty.core.domain.enums.EmailDispatchStatus;
import com.habitparty.core.domain.enums.EmailType;

@Component
public class AsyncAuthEmailDispatcher {
  private static final Logger log = LoggerFactory.getLogger(AsyncAuthEmailDispatcher.class);

  private final EmailSenderPort emailSender;
  private final EmailDispatchLogRepository emailLogPort;
  private final Clock clock;

  @Autowired
  public AsyncAuthEmailDispatcher(
      EmailSenderPort emailSender,
      EmailDispatchLogRepository emailLogPort,
      @Nullable Clock clock) {
    this.emailSender = emailSender;
    this.emailLogPort = emailLogPort;
    this.clock = clock != null ? clock : Clock.systemUTC();
  }

  @Async("applicationTaskExecutor")
  public void dispatchPasswordReset(UUID userId, String email, String resetLink) {
    boolean success = false;
    String errorMessage = null;
    try {
      success = emailSender.sendPasswordResetEmail(email, resetLink);
      if (!success) {
        errorMessage = "Falha ao enviar e-mail via Resend";
      }
    } catch (Exception e) {
      errorMessage = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
      log.error("[AsyncAuthEmailDispatcher] Erro ao despachar e-mail de recuperação de senha para userId={}: {}",
          userId, errorMessage, e);
    }

    safeSaveLog(
        userId,
        EmailType.PASSWORD_RESET,
        email,
        "Recuperação de Senha - HabitParty",
        success,
        errorMessage);
  }

  @Async("applicationTaskExecutor")
  public void dispatchEmailVerification(UUID userId, String email, String userName, String verificationLink) {
    boolean success = false;
    String errorMessage = null;
    try {
      success = emailSender.sendEmailVerificationEmail(email, userName, verificationLink);
      if (!success) {
        errorMessage = "Falha ao enviar e-mail de verificação via Resend";
      }
    } catch (Exception e) {
      errorMessage = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
      log.error("[AsyncAuthEmailDispatcher] Erro ao despachar e-mail de verificação para userId={}: {}",
          userId, errorMessage, e);
    }

    safeSaveLog(
        userId,
        EmailType.EMAIL_VERIFICATION,
        email,
        "Confirme seu e-mail - HabitParty",
        success,
        errorMessage);
  }

  private void safeSaveLog(
      UUID userId,
      EmailType emailType,
      String email,
      String subject,
      boolean success,
      String errorMessage) {
    try {
      emailLogPort.save(new EmailDispatchLog(
          UUID.randomUUID(),
          userId,
          null,
          emailType,
          email,
          subject,
          success ? EmailDispatchStatus.SENT : EmailDispatchStatus.FAILED,
          success ? null : errorMessage,
          LocalDateTime.now(clock)));
    } catch (Exception e) {
      log.warn("[AsyncAuthEmailDispatcher] Falha ao persistir EmailDispatchLog ({}) para userId={}: {}",
          emailType, userId, e.getMessage());
    }
  }
}
