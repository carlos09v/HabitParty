package com.habitparty.application.usecases.auth;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.function.BooleanSupplier;

import org.springframework.lang.Nullable;
import org.springframework.transaction.support.TransactionOperations;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.habitparty.application.ports.EmailDispatchLogRepository;
import com.habitparty.application.ports.UserTokenRepository;
import com.habitparty.core.domain.entities.EmailDispatchLog;
import com.habitparty.core.domain.entities.UserToken;
import com.habitparty.core.domain.enums.EmailDispatchStatus;
import com.habitparty.core.domain.enums.EmailType;
import com.habitparty.core.domain.enums.UserTokenType;

/**
 * Serviço compartilhado de emissão e despacho transacional de tokens de e-mail
 * (recuperação de senha e verificação de conta), evitando I/O externo dentro de transações
 * e centralizando hash SHA-256, invalidação prévia e fallback síncrono com log.
 */
final class EmailTokenDispatchService {

  private EmailTokenDispatchService() {
  }

  static String normalizeFrontendUrl(String frontendUrl) {
    if (frontendUrl == null) {
      return "";
    }
    return frontendUrl.endsWith("/") ? frontendUrl.substring(0, frontendUrl.length() - 1) : frontendUrl;
  }

  static String issueHashedToken(
      UUID userId,
      UserTokenType tokenType,
      Duration ttl,
      UserTokenRepository tokenRepository,
      @Nullable TransactionOperations transactionOperations) {
    String rawTokenValue = UUID.randomUUID().toString();
    String hashedTokenValue = UserToken.hashToken(rawTokenValue);

    UserToken token = new UserToken(
        UUID.randomUUID(),
        userId,
        tokenType,
        hashedTokenValue,
        Instant.now().plus(ttl),
        false);

    executeInTransaction(transactionOperations, () -> {
      tokenRepository.invalidateActiveTokensByUserIdAndType(userId, tokenType);
      tokenRepository.save(token);
    });

    return rawTokenValue;
  }

  static void dispatchOrSendSync(
      UUID userId,
      String recipientEmail,
      EmailType emailType,
      String subject,
      String failureMessage,
      @Nullable Runnable asyncDispatch,
      BooleanSupplier syncSender,
      EmailDispatchLogRepository emailLogPort) {
    if (asyncDispatch != null) {
      dispatchAfterCommitOrNow(asyncDispatch);
      return;
    }

    boolean success = syncSender.getAsBoolean();
    emailLogPort.save(new EmailDispatchLog(
        UUID.randomUUID(),
        userId,
        null,
        emailType,
        recipientEmail,
        subject,
        success ? EmailDispatchStatus.SENT : EmailDispatchStatus.FAILED,
        success ? null : failureMessage,
        LocalDateTime.now()));
  }

  private static void executeInTransaction(@Nullable TransactionOperations transactionOperations, Runnable action) {
    if (transactionOperations == null) {
      action.run();
      return;
    }
    transactionOperations.executeWithoutResult(status -> action.run());
  }

  private static void dispatchAfterCommitOrNow(Runnable dispatchAction) {
    if (TransactionSynchronizationManager.isSynchronizationActive()) {
      TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
        @Override
        public void afterCommit() {
          dispatchAction.run();
        }
      });
    } else {
      dispatchAction.run();
    }
  }
}
