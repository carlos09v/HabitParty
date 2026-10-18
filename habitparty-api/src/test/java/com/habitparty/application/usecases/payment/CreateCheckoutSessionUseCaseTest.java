package com.habitparty.application.usecases.payment;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.habitparty.application.ports.PaymentGatewayPort;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.enums.PaymentMethodType;
import com.habitparty.core.domain.enums.PlanType;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserRole;

@ExtendWith(MockitoExtension.class)
class CreateCheckoutSessionUseCaseTest {

  @Mock
  private UserRepository userRepository;

  @Mock
  private PaymentGatewayPort paymentGatewayPort;

  @InjectMocks
  private CreateCheckoutSessionUseCase createCheckoutSessionUseCase;

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
  @DisplayName("Deve criar sessão de checkout e vincular Stripe Customer ID ao usuário")
  void testCreateCheckoutSessionSuccess() {
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(paymentGatewayPort.createOrGetCustomer(user)).thenReturn("cus_generated_123");
    when(paymentGatewayPort.createCheckoutSession(
        eq(user),
        eq(PlanType.MONTHLY),
        eq(PaymentMethodType.PIX),
        eq("cus_generated_123")
    )).thenReturn("https://checkout.stripe.com/c/pay/cs_test_123");

    String checkoutUrl = createCheckoutSessionUseCase.execute(userId, PlanType.MONTHLY, PaymentMethodType.PIX);

    assertNotNull(checkoutUrl);
    assertEquals("https://checkout.stripe.com/c/pay/cs_test_123", checkoutUrl);
    assertEquals("cus_generated_123", user.getStripeCustomerId());
    verify(userRepository).save(user);
    verify(paymentGatewayPort).createCheckoutSession(eq(user), eq(PlanType.MONTHLY), eq(PaymentMethodType.PIX), eq("cus_generated_123"));
  }

  @Test
  @DisplayName("Deve impedir criação de nova sessão no cartão se usuário já tem assinatura recorrente ativa")
  void testCreateCheckoutSessionFailsWhenAlreadySubscribed() {
    user.activateSubscription("cus_123", "sub_active_123", LocalDateTime.now().plusMonths(1));
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));

    assertThrows(com.habitparty.core.exceptions.DomainValidationException.class, () ->
        createCheckoutSessionUseCase.execute(userId, PlanType.MONTHLY, PaymentMethodType.CREDIT_CARD)
    );
    verify(paymentGatewayPort, never()).createCheckoutSession(any(), any(), any(), any());
  }

  @Test
  @DisplayName("Deve permitir checkout de Membro Fundador quando ainda restarem vagas")
  void testCreateCheckoutSessionFounderSuccess() {
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(userRepository.countFounders()).thenReturn(20L); // 20 de 30 vagas preenchidas
    when(paymentGatewayPort.createOrGetCustomer(user)).thenReturn("cus_founder_123");
    when(paymentGatewayPort.createCheckoutSession(
        eq(user),
        eq(PlanType.FOUNDER_ANNUAL),
        eq(PaymentMethodType.CREDIT_CARD),
        eq("cus_founder_123")
    )).thenReturn("https://checkout.stripe.com/c/pay/cs_founder_test");

    String url = createCheckoutSessionUseCase.execute(userId, PlanType.FOUNDER_ANNUAL, PaymentMethodType.CREDIT_CARD);

    assertNotNull(url);
    assertEquals("https://checkout.stripe.com/c/pay/cs_founder_test", url);
  }

  @Test
  @DisplayName("Deve bloquear checkout de Membro Fundador quando limite de 30 vagas for atingido")
  void testCreateCheckoutSessionFounderFailsWhenSlotsExceeded() {
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(userRepository.countFounders()).thenReturn(30L); // Todas as 30 vagas preenchidas

    com.habitparty.core.exceptions.DomainValidationException ex = assertThrows(
        com.habitparty.core.exceptions.DomainValidationException.class,
        () -> createCheckoutSessionUseCase.execute(userId, PlanType.FOUNDER_ANNUAL, PaymentMethodType.CREDIT_CARD)
    );

    assertTrue(ex.getMessage().contains("esgotado"));
    verify(paymentGatewayPort, never()).createCheckoutSession(any(), any(), any(), any());
  }
}
