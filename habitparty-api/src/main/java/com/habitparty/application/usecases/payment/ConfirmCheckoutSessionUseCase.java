package com.habitparty.application.usecases.payment;

import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.habitparty.application.ports.PaymentGatewayPort;
import com.habitparty.application.ports.PaymentWebhookEvent;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.User;

import org.springframework.transaction.annotation.Transactional;

@Service
public class ConfirmCheckoutSessionUseCase {
  private static final Logger log = LoggerFactory.getLogger(ConfirmCheckoutSessionUseCase.class);

  private final PaymentGatewayPort paymentGatewayPort;
  private final ProcessStripeWebhookUseCase processStripeWebhookUseCase;
  private final UserRepository userRepository;

  public ConfirmCheckoutSessionUseCase(
      PaymentGatewayPort paymentGatewayPort,
      ProcessStripeWebhookUseCase processStripeWebhookUseCase,
      UserRepository userRepository) {
    this.paymentGatewayPort = paymentGatewayPort;
    this.processStripeWebhookUseCase = processStripeWebhookUseCase;
    this.userRepository = userRepository;
  }

  @Transactional
  public Optional<User> execute(UUID userId, String sessionId) {
    if (sessionId == null || sessionId.isBlank()) {
      return Optional.empty();
    }

    Optional<PaymentWebhookEvent.CheckoutCompleted> checkoutOpt =
        paymentGatewayPort.retrievePaidCheckoutSession(sessionId);

    if (checkoutOpt.isEmpty()) {
      log.info("Sessão de checkout {} não confirmada como paga ou inexistente no gateway.", sessionId);
      return Optional.empty();
    }

    PaymentWebhookEvent.CheckoutCompleted checkout = checkoutOpt.get();

    // Trava de segurança: impede que um usuário tente confirmar a sessão de outro
    if (checkout.userId() != null && !checkout.userId().equals(userId)) {
      log.warn("Tentativa de confirmação de checkout com usuário divergente! Autenticado: {}, Sessão: {}",
          userId, checkout.userId());
      return Optional.empty();
    }

    PaymentWebhookEvent.CheckoutCompleted effectiveCheckout = (checkout.userId() == null)
        ? new PaymentWebhookEvent.CheckoutCompleted(
            checkout.eventId(),
            checkout.sessionId(),
            checkout.mode(),
            checkout.customerId(),
            checkout.subscriptionId(),
            userId,
            checkout.customerEmail(),
            checkout.days(),
            checkout.metadata())
        : checkout;

    processStripeWebhookUseCase.execute(effectiveCheckout);

    // Validação estrita: somente devolve o usuário se ele de fato foi ativado como Premium!
    Optional<User> updatedUserOpt = userRepository.findById(userId);
    if (updatedUserOpt.isPresent() && updatedUserOpt.get().isPremium()) {
      return updatedUserOpt;
    }

    log.warn("Sessão {} processada, mas o usuário {} não consta com status Premium ativo.", sessionId, userId);
    return Optional.empty();
  }
}
