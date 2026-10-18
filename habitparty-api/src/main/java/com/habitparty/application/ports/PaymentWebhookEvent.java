package com.habitparty.application.ports;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

public sealed interface PaymentWebhookEvent {
  String eventId();

  record CheckoutCompleted(
      String eventId,
      String sessionId,
      String mode,
      String customerId,
      String subscriptionId,
      UUID userId,
      String customerEmail,
      int days,
      Map<String, String> metadata
  ) implements PaymentWebhookEvent {}

  record SubscriptionUpdated(
      String eventId,
      String subscriptionId,
      String customerId,
      UUID userId,
      LocalDateTime periodEnd,
      String status,
      Map<String, String> metadata
  ) implements PaymentWebhookEvent {}

  record SubscriptionDeleted(
      String eventId,
      String subscriptionId,
      String customerId,
      UUID userId,
      Map<String, String> metadata
  ) implements PaymentWebhookEvent {}

  record IgnoredEvent(String eventId, String eventType) implements PaymentWebhookEvent {}
}
