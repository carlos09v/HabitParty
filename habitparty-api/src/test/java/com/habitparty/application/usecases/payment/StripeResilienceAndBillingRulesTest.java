package com.habitparty.application.usecases.payment;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.habitparty.application.ports.PaymentEventRepository;
import com.habitparty.application.ports.PaymentGatewayPort;
import com.habitparty.application.ports.PaymentWebhookEvent;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.enums.PaymentMethodType;
import com.habitparty.core.domain.enums.PlanType;
import com.habitparty.core.domain.enums.SubscriptionStatus;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserRole;
import com.habitparty.core.exceptions.DomainValidationException;

class StripeResilienceAndBillingRulesTest {

  private User createUser(UUID userId, boolean isFounder) {
    User user = new User(
        userId, UserRole.USER, false, "Carlos", "carlos", "carlos@habitparty.com",
        "hash", BigDecimal.TEN, BigDecimal.TEN, LocalDate.of(1995, 5, 20),
        null, UserGender.MALE, 100, 1, 1, LocalDateTime.now());
    if (isFounder) {
      user.grantFounderStatus();
    }
    return user;
  }

  @Test
  @DisplayName("[P-01 + Decisão 4] past_due e unpaid revogam Premium imediatamente salvo saldo Pix pré-pago vigente")
  void pastDueAndUnpaidRevokeImmediatelyUnlessPrepaidPixRemains() {
    UUID recurringUserId = UUID.randomUUID();
    User recurringUser = createUser(recurringUserId, false);
    LocalDateTime paidCycleEnd = LocalDateTime.now().plusDays(5);
    recurringUser.activateSubscription("cus_1", "sub_1", paidCycleEnd);
    assertTrue(recurringUser.isPremium());

    UserRepository userRepo = mock(UserRepository.class);
    PaymentEventRepository eventRepo = mock(PaymentEventRepository.class);
    PaymentGatewayPort gatewayPort = mock(PaymentGatewayPort.class);

    when(eventRepo.claimEvent(any(), any(), any())).thenReturn(true);
    when(userRepo.findByIdForUpdate(recurringUserId)).thenReturn(Optional.of(recurringUser));
    when(userRepo.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

    ProcessStripeWebhookUseCase webhookUseCase = new ProcessStripeWebhookUseCase(
        userRepo, eventRepo, gatewayPort);

    LocalDateTime unpaidNewPeriodEnd = LocalDateTime.now().plusMonths(1);
    webhookUseCase.execute(new PaymentWebhookEvent.SubscriptionUpdated(
        "evt_past_due", "sub_1", "cus_1", recurringUserId, unpaidNewPeriodEnd, "past_due", Map.of(), false));

    assertEquals(SubscriptionStatus.PAST_DUE, recurringUser.getSubscriptionStatus());
    assertFalse(recurringUser.isPremium());
    assertFalse(recurringUser.getSubscriptionEndsAt().isAfter(LocalDateTime.now().plusSeconds(5)));

    // Cenário 2: Usuário com saldo pré-pago via Pix (200 dias) preserva Pix restante mesmo se cartão ficar past_due
    UUID hybridUserId = UUID.randomUUID();
    User hybridUser = createUser(hybridUserId, false);
    hybridUser.extendSubscriptionDays(200);
    LocalDateTime pixExpiry = hybridUser.getPrepaidEndsAt();
    hybridUser.activateSubscription("cus_2", "sub_2", LocalDateTime.now().plusMonths(1));
    when(userRepo.findByIdForUpdate(hybridUserId)).thenReturn(Optional.of(hybridUser));

    webhookUseCase.execute(new PaymentWebhookEvent.SubscriptionUpdated(
        "evt_past_due_hybrid", "sub_2", "cus_2", hybridUserId, unpaidNewPeriodEnd, "past_due", Map.of(), false));

    assertEquals(SubscriptionStatus.PAST_DUE, hybridUser.getSubscriptionStatus());
    assertTrue(hybridUser.isPremium());
    assertFalse(hybridUser.hasActiveRecurringSubscription());
    assertEquals(pixExpiry, hybridUser.getSubscriptionEndsAt());
  }

  @Test
  @DisplayName("[P-03 + P-06] cancel_at_period_end propaga estado e renovação ativa não encurta Pix pré-pago")
  void cancelAtPeriodEndPropagatesAndPrepaidPixIsNeverShortened() {
    UUID userId = UUID.randomUUID();
    User user = createUser(userId, false);
    user.extendSubscriptionDays(300);
    LocalDateTime pixEnds = user.getPrepaidEndsAt();

    UserRepository userRepo = mock(UserRepository.class);
    PaymentEventRepository eventRepo = mock(PaymentEventRepository.class);
    PaymentGatewayPort gatewayPort = mock(PaymentGatewayPort.class);

    when(eventRepo.claimEvent(any(), any(), any())).thenReturn(true);
    when(userRepo.findByIdForUpdate(userId)).thenReturn(Optional.of(user));
    when(userRepo.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

    ProcessStripeWebhookUseCase webhookUseCase = new ProcessStripeWebhookUseCase(
        userRepo, eventRepo, gatewayPort);

    LocalDateTime shorterMonthlyPeriodEnd = LocalDateTime.now().plusDays(30);
    webhookUseCase.execute(new PaymentWebhookEvent.SubscriptionUpdated(
        "evt_cancel_sched", "sub_x", "cus_x", userId, shorterMonthlyPeriodEnd, "active", Map.of(), true));

    assertTrue(user.isPremium());
    assertTrue(user.isCancelAtPeriodEnd());
    assertFalse(user.hasActiveRecurringSubscription());
    assertEquals(pixEnds, user.getSubscriptionEndsAt());
  }

  @Test
  @DisplayName("[P-05] Webhook cujo usuário não é encontrado lança erro para retry HTTP 500 ao invés de marcar FAILED definitivo")
  void unresolvedWebhookUserThrowsForStripeRetry() {
    UUID missingUserId = UUID.randomUUID();
    UserRepository userRepo = mock(UserRepository.class);
    PaymentEventRepository eventRepo = mock(PaymentEventRepository.class);
    PaymentGatewayPort gatewayPort = mock(PaymentGatewayPort.class);

    when(eventRepo.claimEvent(any(), any(), any())).thenReturn(true);
    when(userRepo.findByIdForUpdate(missingUserId)).thenReturn(Optional.empty());

    ProcessStripeWebhookUseCase webhookUseCase = new ProcessStripeWebhookUseCase(
        userRepo, eventRepo, gatewayPort);

    assertThrows(IllegalStateException.class, () -> webhookUseCase.execute(
        new PaymentWebhookEvent.CheckoutCompleted(
            "evt_missing_user", "cs_missing", "payment", "cus_missing", null,
            missingUserId, "missing@habitparty.com", 30, Map.of())));
  }

  @Test
  @DisplayName("[P-07 + Decisão 3] Founder existente pode renovar FOUNDER_ANNUAL mesmo após lote de 30 vagas esgotado e Portal rejeita FREE")
  void existingFounderCanRenewAfterQuotaFullAndPortalRejectsFreeWithoutCustomer() {
    UUID founderId = UUID.randomUUID();
    User existingFounder = createUser(founderId, true);
    existingFounder.setStripeCustomerId("cus_existing_founder");

    UserRepository userRepo = mock(UserRepository.class);
    PaymentGatewayPort gatewayPort = mock(PaymentGatewayPort.class);
    when(userRepo.findById(founderId)).thenReturn(Optional.of(existingFounder));
    when(userRepo.countFounders()).thenReturn(30L);
    when(gatewayPort.createCheckoutSession(
        existingFounder, PlanType.FOUNDER_ANNUAL, PaymentMethodType.PIX, "cus_existing_founder", "pt-BR"))
        .thenReturn("https://checkout.stripe.com/founder-renew");

    CreateCheckoutSessionUseCase checkoutUseCase = new CreateCheckoutSessionUseCase(userRepo, gatewayPort);
    String url = checkoutUseCase.execute(founderId, PlanType.FOUNDER_ANNUAL, PaymentMethodType.PIX, "pt-BR");
    assertNotNull(url);
    assertEquals("https://checkout.stripe.com/founder-renew", url);
    verify(gatewayPort, org.mockito.Mockito.never()).createOrGetCustomer(any());

    // Novo usuário (não Founder) continua bloqueado com 30/30 vagas esgotadas
    UUID newUserId = UUID.randomUUID();
    User regularUser = createUser(newUserId, false);
    when(userRepo.findById(newUserId)).thenReturn(Optional.of(regularUser));
    assertThrows(DomainValidationException.class, () ->
        checkoutUseCase.execute(newUserId, PlanType.FOUNDER_ANNUAL, PaymentMethodType.CREDIT_CARD, "pt-BR"));

    // Usuário FREE sem stripeCustomerId não cria customer vazio no Portal
    CreateCustomerPortalSessionUseCase portalUseCase = new CreateCustomerPortalSessionUseCase(userRepo, gatewayPort);
    assertThrows(DomainValidationException.class, () ->
        portalUseCase.execute(newUserId, "http://localhost:3000/settings"));
  }
}
