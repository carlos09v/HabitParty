package com.habitparty.core.domain.entities;

import java.time.LocalDateTime;
import java.util.UUID;

import com.habitparty.core.domain.enums.PaymentEventStatus;

public class ProcessedPaymentEvent {
  private UUID id;
  private UUID userId;
  private String stripeEventId;
  private String eventType;
  private PaymentEventStatus status;
  private String errorMessage;
  private LocalDateTime processedAt;

  public ProcessedPaymentEvent(
      UUID id,
      UUID userId,
      String stripeEventId,
      String eventType,
      PaymentEventStatus status,
      String errorMessage,
      LocalDateTime processedAt) {
    this.id = id != null ? id : UUID.randomUUID();
    this.userId = userId;
    this.stripeEventId = stripeEventId;
    this.eventType = eventType;
    this.status = status != null ? status : PaymentEventStatus.PROCESSED;
    this.errorMessage = errorMessage;
    this.processedAt = processedAt != null ? processedAt : LocalDateTime.now();
  }

  public UUID getId() {
    return id;
  }

  public void setId(UUID id) {
    this.id = id;
  }

  public UUID getUserId() {
    return userId;
  }

  public void setUserId(UUID userId) {
    this.userId = userId;
  }

  public String getStripeEventId() {
    return stripeEventId;
  }

  public void setStripeEventId(String stripeEventId) {
    this.stripeEventId = stripeEventId;
  }

  public String getEventType() {
    return eventType;
  }

  public void setEventType(String eventType) {
    this.eventType = eventType;
  }

  public PaymentEventStatus getStatus() {
    return status;
  }

  public void setStatus(PaymentEventStatus status) {
    this.status = status;
  }

  public String getErrorMessage() {
    return errorMessage;
  }

  public void setErrorMessage(String errorMessage) {
    this.errorMessage = errorMessage;
  }

  public LocalDateTime getProcessedAt() {
    return processedAt;
  }

  public void setProcessedAt(LocalDateTime processedAt) {
    this.processedAt = processedAt;
  }
}
