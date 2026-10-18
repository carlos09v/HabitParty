package com.habitparty.application.usecases.payment;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.habitparty.application.ports.PaymentEventRepository;
import com.habitparty.application.ports.PaymentWebhookEvent;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.enums.SubscriptionStatus;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserRole;

@ExtendWith(MockitoExtension.class)
class ProcessStripeWebhookUseCaseTest {

  @Mock
  private UserRepository userRepository;

  @Mock
  private PaymentEventRepository paymentEventRepository;

  @InjectMocks
  private ProcessStripeWebhookUseCase processStripeWebhookUseCase;

  private User user;
  private UUID userId;

  @BeforeEach
  void setUp() {
    userId = UUID.randomUUID();
    user = new User(
        userId,
        UserRole.USER,
        false,
        "Aventureiro Teste",
        "aventureiro",
        "teste@habitparty.com",
        "hashed_pwd",
        BigDecimal.ZERO,
        BigDecimal.ZERO,
        LocalDate.of(1995, 5, 20),
        null,
        UserGender.MALE,
        0,
        0,
        0,
        LocalDateTime.now()
    );
  }

  @Test
  @DisplayName("Ignora reprocessamento de evento com mesmo eventId (Idempotência)")
  void testIgnoreDuplicateWebhookEvent() {
    when(paymentEventRepository.existsByEventId("evt_dup_123")).thenReturn(true);

    PaymentWebhookEvent event = new PaymentWebhookEvent.CheckoutCompleted(
        "evt_dup_123",
        "cs_123",
        "payment",
        "cus_123",
        null,
        userId,
        "teste@habitparty.com",
        30,
        Map.of("days", "30")
    );

    processStripeWebhookUseCase.execute(event);

    verify(userRepository, never()).findById(any());
    verify(userRepository, never()).save(any());
    verify(paymentEventRepository, never()).recordEvent(any(), any());
  }

  @Test
  @DisplayName("Processa Pix avulso com sucesso e estende dias")
  void testProcessPixCheckoutCompleted() {
    when(paymentEventRepository.existsByEventId("evt_pix_123")).thenReturn(false);
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));

    PaymentWebhookEvent event = new PaymentWebhookEvent.CheckoutCompleted(
        "evt_pix_123",
        "cs_pix_123",
        "payment",
        "cus_123",
        null,
        userId,
        "teste@habitparty.com",
        30,
        Map.of("days", "30")
    );

    processStripeWebhookUseCase.execute(event);

    assertTrue(user.isPremium());
    assertEquals(SubscriptionStatus.ACTIVE, user.getSubscriptionStatus());
    assertNotNull(user.getSubscriptionEndsAt());
    verify(userRepository).save(user);
    verify(paymentEventRepository).recordEvent("session_cs_pix_123", "CheckoutSessionCompleted");
    verify(paymentEventRepository).recordEvent("evt_pix_123", "CheckoutCompleted");
  }

  @Test
  @DisplayName("Assinatura Anual no Cartão concede 1 ano completo de expiração")
  void testProcessAnnualSubscriptionCheckoutCompleted() {
    when(paymentEventRepository.existsByEventId("evt_annual_123")).thenReturn(false);
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));

    PaymentWebhookEvent event = new PaymentWebhookEvent.CheckoutCompleted(
        "evt_annual_123",
        "cs_annual_123",
        "subscription",
        "cus_123",
        "sub_annual_123",
        userId,
        "teste@habitparty.com",
        365,
        Map.of("plan", "ANNUAL")
    );

    processStripeWebhookUseCase.execute(event);

    assertTrue(user.isPremium());
    assertEquals(SubscriptionStatus.ACTIVE, user.getSubscriptionStatus());
    assertEquals("sub_annual_123", user.getStripeSubscriptionId());
    // Deve vencer em aproximadamente 1 ano (mais de 360 dias)
    assertTrue(user.getSubscriptionEndsAt().isAfter(LocalDateTime.now().plusDays(360)));
    verify(userRepository).save(user);
    verify(paymentEventRepository).recordEvent("session_cs_annual_123", "CheckoutSessionCompleted");
    verify(paymentEventRepository).recordEvent("evt_annual_123", "CheckoutCompleted");
  }

  @Test
  @DisplayName("Ignora duplicidade se a sessão de checkout já foi ativada (prevenção de duplicidade entre verificação direta e webhook)")
  void testIgnoreDuplicateCheckoutSessionId() {
    when(paymentEventRepository.existsByEventId("evt_wh_123")).thenReturn(false);
    when(paymentEventRepository.existsByEventId("session_cs_already_paid")).thenReturn(true);

    PaymentWebhookEvent event = new PaymentWebhookEvent.CheckoutCompleted(
        "evt_wh_123",
        "cs_already_paid",
        "payment",
        "cus_123",
        null,
        userId,
        "teste@habitparty.com",
        365,
        Map.of("days", "365")
    );

    processStripeWebhookUseCase.execute(event);

    // Não deve salvar o usuário novamente (não duplica os dias do Pix)
    verify(userRepository, never()).save(any());
    // Deve registrar o evento do webhook como finalizado
    verify(paymentEventRepository).recordEvent("evt_wh_123", "CheckoutCompleted");
  }
}
