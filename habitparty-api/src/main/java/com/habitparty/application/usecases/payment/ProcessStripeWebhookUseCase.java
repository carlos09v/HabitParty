package com.habitparty.application.usecases.payment;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.PaymentEventRepository;
import com.habitparty.application.ports.PaymentGatewayPort;
import com.habitparty.application.ports.PaymentWebhookEvent;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.enums.PaymentEventStatus;
import com.habitparty.core.domain.enums.SubscriptionStatus;

@Service
public class ProcessStripeWebhookUseCase {
  private static final Logger log = LoggerFactory.getLogger(ProcessStripeWebhookUseCase.class);

  private final UserRepository userRepository;
  private final PaymentEventRepository paymentEventRepository;
  private final PaymentGatewayPort paymentGatewayPort;

  public ProcessStripeWebhookUseCase(
      UserRepository userRepository,
      PaymentEventRepository paymentEventRepository) {
    this(userRepository, paymentEventRepository, null);
  }

  @Autowired
  public ProcessStripeWebhookUseCase(
      UserRepository userRepository,
      PaymentEventRepository paymentEventRepository,
      PaymentGatewayPort paymentGatewayPort) {
    this.userRepository = userRepository;
    this.paymentEventRepository = paymentEventRepository;
    this.paymentGatewayPort = paymentGatewayPort;
  }

  @Transactional
  public void execute(String payload, String sigHeader) {
    PaymentWebhookEvent event = paymentGatewayPort.parseWebhookEvent(payload, sigHeader);
    processEvent(event);
  }

  @Transactional
  public void execute(PaymentWebhookEvent event) {
    processEvent(event);
  }

  private void processEvent(PaymentWebhookEvent event) {
    if (event.eventId() != null && paymentEventRepository.existsByEventId(event.eventId())) {
      log.info("Evento de pagamento {} já processado anteriormente. Ignorando reprocessamento.", event.eventId());
      return;
    }

    if (event instanceof PaymentWebhookEvent.CheckoutCompleted checkout && checkout.sessionId() != null) {
      if (paymentEventRepository.existsByEventId("session_" + checkout.sessionId())) {
        log.info("Sessão de checkout {} já teve seus benefícios processados anteriormente. Ignorando duplicidade.", checkout.sessionId());
        if (event.eventId() != null) {
          paymentEventRepository.recordEvent(
              event.eventId(),
              event.getClass().getSimpleName(),
              checkout.userId(),
              PaymentEventStatus.IGNORED,
              "Sessão já processada anteriormente via confirmação síncrona"
          );
        }
        return;
      }
    }

    UUID resolvedUserId = null;
    PaymentEventStatus status = PaymentEventStatus.PROCESSED;
    String errorMessage = null;

    switch (event) {
      case PaymentWebhookEvent.CheckoutCompleted checkout -> {
        resolvedUserId = handleCheckoutCompleted(checkout);
        if (resolvedUserId == null) {
          status = PaymentEventStatus.FAILED;
          errorMessage = "Usuário não encontrado para a sessão de checkout: " + checkout.sessionId();
        }
      }
      case PaymentWebhookEvent.SubscriptionUpdated subUpdated -> {
        resolvedUserId = handleSubscriptionUpdated(subUpdated);
        if (resolvedUserId == null) {
          status = PaymentEventStatus.FAILED;
          errorMessage = "Usuário não encontrado para assinatura: " + subUpdated.subscriptionId();
        }
      }
      case PaymentWebhookEvent.SubscriptionDeleted subDeleted -> {
        resolvedUserId = handleSubscriptionDeleted(subDeleted);
        if (resolvedUserId == null) {
          status = PaymentEventStatus.FAILED;
          errorMessage = "Usuário não encontrado para cancelamento: " + subDeleted.subscriptionId();
        }
      }
      case PaymentWebhookEvent.IgnoredEvent ignored -> {
        log.debug("Evento de pagamento ignorado: {}", ignored.eventType());
        status = PaymentEventStatus.IGNORED;
      }
    }

    if (event instanceof PaymentWebhookEvent.CheckoutCompleted checkout
        && checkout.sessionId() != null
        && status == PaymentEventStatus.PROCESSED) {
      paymentEventRepository.recordEvent(
          "session_" + checkout.sessionId(),
          "CheckoutSessionCompleted",
          resolvedUserId,
          PaymentEventStatus.PROCESSED,
          null
      );
    }

    if (event.eventId() != null) {
      String typeName = (event instanceof PaymentWebhookEvent.IgnoredEvent ignored && ignored.eventType() != null)
          ? ignored.eventType()
          : event.getClass().getSimpleName();
      paymentEventRepository.recordEvent(
          event.eventId(),
          typeName,
          resolvedUserId,
          status,
          errorMessage
      );
    }
  }

  private UUID handleCheckoutCompleted(PaymentWebhookEvent.CheckoutCompleted checkout) {
    log.info("Sessão de checkout concluída: id={}, mode={}", checkout.sessionId(), checkout.mode());

    User user = findUser(checkout.userId(), checkout.customerId(), checkout.customerEmail()).orElse(null);
    if (user == null) {
      log.error("Usuário não encontrado para a sessão de checkout: {}", checkout.sessionId());
      return null;
    }

    if (checkout.customerId() != null && !checkout.customerId().isBlank()) {
      user.setStripeCustomerId(checkout.customerId());
    }

    boolean isFounder = false;
    if (checkout.metadata() != null) {
      String planMeta = checkout.metadata().get("plan");
      String isFounderMeta = checkout.metadata().get("isFounder");
      if ("FOUNDER_ANNUAL".equalsIgnoreCase(planMeta) || "true".equalsIgnoreCase(isFounderMeta)) {
        isFounder = true;
      }
    }

    if (isFounder) {
      user.grantFounderStatus();
      log.info("Usuário {} agraciado com o status vitalício de Membro Fundador!", user.getId());
    }

    // Modo PAYMENT (Pix Avulso)
    if ("payment".equalsIgnoreCase(checkout.mode())) {
      int days = checkout.days() > 0 ? checkout.days() : 30;
      user.extendSubscriptionDays(days);
      userRepository.save(user);
      log.info("Assinatura via Pix ativada/estendida com sucesso para o usuário {}: +{} dias (até {})",
          user.getId(), days, user.getSubscriptionEndsAt());
      return user.getId();
    }

    // Modo SUBSCRIPTION (Cartão Recorrente)
    if ("subscription".equalsIgnoreCase(checkout.mode())) {
      String subscriptionId = checkout.subscriptionId();
      String plan = checkout.metadata() != null ? checkout.metadata().get("plan") : null;
      LocalDateTime endsAt = ("ANNUAL".equalsIgnoreCase(plan) || "FOUNDER_ANNUAL".equalsIgnoreCase(plan))
          ? LocalDateTime.now().plusYears(1)
          : LocalDateTime.now().plusMonths(1);

      user.activateSubscription(checkout.customerId(), subscriptionId, endsAt);
      userRepository.save(user);
      log.info("Assinatura recorrente ({}) inicializada para o usuário {}: subscriptionId={}, endsAt={}",
          plan, user.getId(), subscriptionId, endsAt);
    }

    return user.getId();
  }

  private UUID handleSubscriptionUpdated(PaymentWebhookEvent.SubscriptionUpdated subUpdated) {
    log.info("Assinatura atualizada: id={}, status={}", subUpdated.subscriptionId(), subUpdated.status());

    User user = findUser(subUpdated.userId(), subUpdated.customerId(), null).orElse(null);
    if (user == null) {
      log.warn("Usuário não encontrado para a assinatura atualizada: {}", subUpdated.subscriptionId());
      return null;
    }

    user.setStripeSubscriptionId(subUpdated.subscriptionId());
    if (subUpdated.customerId() != null) {
      user.setStripeCustomerId(subUpdated.customerId());
    }

    if (subUpdated.metadata() != null) {
      String planMeta = subUpdated.metadata().get("plan");
      String isFounderMeta = subUpdated.metadata().get("isFounder");
      if ("FOUNDER_ANNUAL".equalsIgnoreCase(planMeta) || "true".equalsIgnoreCase(isFounderMeta)) {
        user.grantFounderStatus();
      }
    }

    if (subUpdated.periodEnd() != null) {
      user.setSubscriptionEndsAt(subUpdated.periodEnd());
    }

    String status = subUpdated.status();
    if ("active".equalsIgnoreCase(status) || "trialing".equalsIgnoreCase(status)) {
      user.setSubscriptionStatus(SubscriptionStatus.ACTIVE);
      user.setPremium(true);
    } else if ("past_due".equalsIgnoreCase(status)) {
      user.markPastDue();
    } else if ("canceled".equalsIgnoreCase(status) || "unpaid".equalsIgnoreCase(status)) {
      user.cancelSubscription();
    }

    userRepository.save(user);
    log.info("Status da assinatura do usuário {} atualizado para {} (endsAt: {})",
        user.getId(), user.getSubscriptionStatus(), user.getSubscriptionEndsAt());
    return user.getId();
  }

  private UUID handleSubscriptionDeleted(PaymentWebhookEvent.SubscriptionDeleted subDeleted) {
    log.info("Assinatura cancelada/deletada: id={}", subDeleted.subscriptionId());

    User user = findUser(subDeleted.userId(), subDeleted.customerId(), null).orElse(null);
    if (user == null) {
      log.warn("Usuário não encontrado para a assinatura cancelada: {}", subDeleted.subscriptionId());
      return null;
    }

    user.cancelSubscription();
    userRepository.save(user);
    log.info("Assinatura do usuário {} cancelada com sucesso.", user.getId());
    return user.getId();
  }

  private Optional<User> findUser(UUID userId, String customerId, String email) {
    if (userId != null) {
      Optional<User> userOpt = userRepository.findById(userId);
      if (userOpt.isPresent()) return userOpt;
    }

    if (customerId != null && !customerId.isBlank()) {
      Optional<User> userOpt = userRepository.findByStripeCustomerId(customerId);
      if (userOpt.isPresent()) return userOpt;
    }

    if (email != null && !email.isBlank()) {
      return userRepository.findByEmail(email.trim().toLowerCase());
    }

    return Optional.empty();
  }
}
