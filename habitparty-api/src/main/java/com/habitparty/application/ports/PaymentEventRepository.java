package com.habitparty.application.ports;

import java.util.UUID;

import com.habitparty.core.domain.enums.PaymentEventStatus;

public interface PaymentEventRepository {
  boolean existsByEventId(String stripeEventId);
  void recordEvent(String stripeEventId, String eventType);
  void recordEvent(
      String stripeEventId,
      String eventType,
      UUID userId,
      PaymentEventStatus status,
      String errorMessage
  );

  /**
   * Garante inserção atômica da chave de idempotência dentro da transação atual:
   * - Se já existir como PROCESSED ou IGNORED, retorna {@code false}.
   * - Se existir como FAILED, atualiza para PROCESSED e retorna {@code true}.
   * - Caso contrário insere via constraint real no banco (lançando DataIntegrityViolationException em corrida).
   */
  default boolean claimEvent(String stripeEventId, String eventType, UUID userId) {
    if (existsByEventId(stripeEventId)) {
      return false;
    }
    recordEvent(stripeEventId, eventType, userId, PaymentEventStatus.PROCESSED, null);
    return true;
  }
}
