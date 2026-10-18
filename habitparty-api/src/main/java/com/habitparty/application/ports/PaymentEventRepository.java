package com.habitparty.application.ports;

public interface PaymentEventRepository {
  boolean existsByEventId(String eventId);
  void recordEvent(String eventId, String eventType);
}
