package com.habitparty.application.usecases.payment;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.habitparty.application.ports.PaymentGatewayPort;
import com.habitparty.application.ports.PaymentWebhookEvent;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.User;

@ExtendWith(MockitoExtension.class)
class ConfirmCheckoutSessionUseCaseTest {

  @Mock
  private PaymentGatewayPort paymentGatewayPort;

  @Mock
  private ProcessStripeWebhookUseCase processStripeWebhookUseCase;

  @Mock
  private UserRepository userRepository;

  @InjectMocks
  private ConfirmCheckoutSessionUseCase confirmCheckoutSessionUseCase;

  @Test
  @DisplayName("Deve retornar vazio se sessionId for nulo ou em branco")
  void testBlankSessionIdReturnsEmpty() {
    assertTrue(confirmCheckoutSessionUseCase.execute(UUID.randomUUID(), null).isEmpty());
    assertTrue(confirmCheckoutSessionUseCase.execute(UUID.randomUUID(), "   ").isEmpty());
  }

  @Test
  @DisplayName("Deve retornar vazio se sessão não for paga no gateway")
  void testUnpaidSessionReturnsEmpty() {
    UUID userId = UUID.randomUUID();
    String sessionId = "cs_test_unpaid";

    when(paymentGatewayPort.retrievePaidCheckoutSession(sessionId)).thenReturn(Optional.empty());

    Optional<User> result = confirmCheckoutSessionUseCase.execute(userId, sessionId);

    assertTrue(result.isEmpty());
    verify(processStripeWebhookUseCase, never()).execute(any());
  }

  @Test
  @DisplayName("Deve processar evento e retornar usuário quando sessão estiver paga")
  void testPaidSessionProcessesAndReturnsUser() {
    UUID userId = UUID.randomUUID();
    String sessionId = "cs_test_paid";

    PaymentWebhookEvent.CheckoutCompleted checkout = new PaymentWebhookEvent.CheckoutCompleted(
        "evt_1",
        sessionId,
        "payment",
        "cus_123",
        null,
        userId,
        "user@email.com",
        365,
        Map.of("plan", "FOUNDER_ANNUAL")
    );

    User mockUser = mock(User.class);
    when(mockUser.isPremium()).thenReturn(true);

    when(paymentGatewayPort.retrievePaidCheckoutSession(sessionId)).thenReturn(Optional.of(checkout));
    when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));

    Optional<User> result = confirmCheckoutSessionUseCase.execute(userId, sessionId);

    assertTrue(result.isPresent());
    assertEquals(mockUser, result.get());
    verify(processStripeWebhookUseCase).execute(checkout);
  }

  @Test
  @DisplayName("Deve retornar vazio se o usuário não constar como Premium após o processamento")
  void testPaidSessionReturnsEmptyIfUserNotPremiumAfterProcess() {
    UUID userId = UUID.randomUUID();
    String sessionId = "cs_test_failed_upgrade";

    PaymentWebhookEvent.CheckoutCompleted checkout = new PaymentWebhookEvent.CheckoutCompleted(
        "evt_2",
        sessionId,
        "payment",
        "cus_123",
        null,
        userId,
        "user@email.com",
        365,
        Map.of("plan", "FOUNDER_ANNUAL")
    );

    User mockUser = mock(User.class);
    when(mockUser.isPremium()).thenReturn(false);

    when(paymentGatewayPort.retrievePaidCheckoutSession(sessionId)).thenReturn(Optional.of(checkout));
    when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));

    Optional<User> result = confirmCheckoutSessionUseCase.execute(userId, sessionId);

    assertTrue(result.isEmpty());
    verify(processStripeWebhookUseCase).execute(checkout);
  }

  @Test
  @DisplayName("Deve rejeitar confirmação se userId autenticado for diferente do userId da sessão")
  void testSessionWithMismatchedUserIdRejected() {
    UUID authenticatedUserId = UUID.randomUUID();
    UUID sessionUserId = UUID.randomUUID();
    String sessionId = "cs_test_hijack";

    PaymentWebhookEvent.CheckoutCompleted checkout = new PaymentWebhookEvent.CheckoutCompleted(
        "evt_hijack",
        sessionId,
        "payment",
        "cus_123",
        null,
        sessionUserId, // Diferente do usuário autenticado!
        "outro@email.com",
        365,
        Map.of("plan", "FOUNDER_ANNUAL")
    );

    when(paymentGatewayPort.retrievePaidCheckoutSession(sessionId)).thenReturn(Optional.of(checkout));

    Optional<User> result = confirmCheckoutSessionUseCase.execute(authenticatedUserId, sessionId);

    assertTrue(result.isEmpty());
    verify(processStripeWebhookUseCase, never()).execute(any());
  }
}
