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
}
