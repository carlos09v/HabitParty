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
import com.habitparty.application.usecases.achievement.EvaluateUserAchievementsUseCase;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.enums.PaymentEventStatus;
import com.habitparty.core.domain.enums.SubscriptionStatus;

@Service
public class ProcessStripeWebhookUseCase {
  private static final Logger log = LoggerFactory.getLogger(ProcessStripeWebhookUseCase.class);

  private final UserRepository userRepository;
  private final PaymentEventRepository paymentEventRepository;
  private final PaymentGatewayPort paymentGatewayPort;
  private EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase;

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

  @Autowired(required = false)
  public void setEvaluateUserAchievementsUseCase(
      EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase) {
    this.evaluateUserAchievementsUseCase = evaluateUserAchievementsUseCase;
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
    String eventTypeName = (event instanceof PaymentWebhookEvent.IgnoredEvent ignored && ignored.eventType() != null)
        ? ignored.eventType()
        : event.getClass().getSimpleName();

    // Claim atômico (INSERT ... ON CONFLICT DO NOTHING) para eliminar corrida entre entregas paralelas do Stripe
    if (event.eventId() != null) {
      UUID initialUserId = extractEventUserId(event);
      boolean claimed = paymentEventRepository.claimEvent(event.eventId(), eventTypeName, initialUserId);
      if (!claimed) {
        log.info("Evento de pagamento {} já processado anteriormente. Ignorando reprocessamento.", event.eventId());
        return;
      }
    }

    if (event instanceof PaymentWebhookEvent.CheckoutCompleted checkout && checkout.sessionId() != null) {
      boolean sessionClaimed = paymentEventRepository.claimEvent(
          "session_" + checkout.sessionId(),
          "CheckoutSessionCompleted",
          checkout.userId());
      if (!sessionClaimed) {
        log.info("Sessão de checkout {} já teve seus benefícios processados anteriormente. Ignorando duplicidade.", checkout.sessionId());
        if (event.eventId() != null) {
          paymentEventRepository.recordEvent(
              event.eventId(),
              eventTypeName,
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

    switch (event) {
      case PaymentWebhookEvent.CheckoutCompleted checkout -> {
        resolvedUserId = handleCheckoutCompleted(checkout);
        if (resolvedUserId == null) {
          throw new IllegalStateException(
              "Usuário não encontrado para a sessão de checkout: " + checkout.sessionId());
        }
      }
      case PaymentWebhookEvent.SubscriptionUpdated subUpdated -> {
        resolvedUserId = handleSubscriptionUpdated(subUpdated);
        if (resolvedUserId == null) {
          throw new IllegalStateException(
              "Usuário não encontrado para assinatura: " + subUpdated.subscriptionId());
        }
      }
      case PaymentWebhookEvent.SubscriptionDeleted subDeleted -> {
        resolvedUserId = handleSubscriptionDeleted(subDeleted);
        if (resolvedUserId == null) {
          throw new IllegalStateException(
              "Usuário não encontrado para cancelamento: " + subDeleted.subscriptionId());
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
      paymentEventRepository.recordEvent(
          event.eventId(),
          eventTypeName,
          resolvedUserId,
          status,
          null
      );
    }
  }

  private UUID extractEventUserId(PaymentWebhookEvent event) {
    return switch (event) {
      case PaymentWebhookEvent.CheckoutCompleted c -> c.userId();
      case PaymentWebhookEvent.SubscriptionUpdated u -> u.userId();
      case PaymentWebhookEvent.SubscriptionDeleted d -> d.userId();
      case PaymentWebhookEvent.IgnoredEvent ignored -> null;
    };
  }

  private UUID handleCheckoutCompleted(PaymentWebhookEvent.CheckoutCompleted checkout) {
    log.info("Sessão de checkout concluída: id={}, mode={}", checkout.sessionId(), checkout.mode());

    User user = findUserForUpdate(checkout.userId(), checkout.customerId(), checkout.customerEmail()).orElse(null);
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
      if (isFounder) {
        evaluateAchievementsIfPresent(user);
      }
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
      if (isFounder) {
        evaluateAchievementsIfPresent(user);
      }
      log.info("Assinatura recorrente ({}) inicializada para o usuário {}: subscriptionId={}, endsAt={}",
          plan, user.getId(), subscriptionId, endsAt);
    } else if (isFounder) {
      userRepository.save(user);
      evaluateAchievementsIfPresent(user);
    }

    return user.getId();
  }

  private UUID handleSubscriptionUpdated(PaymentWebhookEvent.SubscriptionUpdated subUpdated) {
    log.info("Assinatura atualizada: id={}, status={}", subUpdated.subscriptionId(), subUpdated.status());

    User user = findUserForUpdate(subUpdated.userId(), subUpdated.customerId(), null).orElse(null);
    if (user == null) {
      log.warn("Usuário não encontrado para a assinatura atualizada: {}", subUpdated.subscriptionId());
      return null;
    }

    String status = subUpdated.status();
    String currentSubId = user.getStripeSubscriptionId();
    boolean isDifferentSubscription = currentSubId != null && !currentSubId.isBlank()
        && subUpdated.subscriptionId() != null && !subUpdated.subscriptionId().isBlank()
        && !currentSubId.equals(subUpdated.subscriptionId());
    boolean isRevocationStatus = "past_due".equalsIgnoreCase(status)
        || "unpaid".equalsIgnoreCase(status)
        || "canceled".equalsIgnoreCase(status);

    // Evita que evento fora de ordem de uma assinatura antiga revogue uma nova assinatura ativa
    if (isDifferentSubscription && isRevocationStatus && user.hasActiveRecurringSubscription()) {
      log.info(
          "Ignorando evento de revogação ({}) para assinatura antiga {} do usuário {}; assinatura ativa atual é {}.",
          status, subUpdated.subscriptionId(), user.getId(), currentSubId);
      return user.getId();
    }

    user.setStripeSubscriptionId(subUpdated.subscriptionId());
    if (subUpdated.customerId() != null) {
      user.setStripeCustomerId(subUpdated.customerId());
    }

    boolean founderGranted = false;
    if (subUpdated.metadata() != null) {
      String planMeta = subUpdated.metadata().get("plan");
      String isFounderMeta = subUpdated.metadata().get("isFounder");
      if ("FOUNDER_ANNUAL".equalsIgnoreCase(planMeta) || "true".equalsIgnoreCase(isFounderMeta)) {
        user.grantFounderStatus();
        founderGranted = true;
      }
    }

    if ("active".equalsIgnoreCase(status) || "trialing".equalsIgnoreCase(status)) {
      user.syncActiveSubscription(
          subUpdated.customerId(),
          subUpdated.subscriptionId(),
          subUpdated.periodEnd(),
          subUpdated.cancelAtPeriodEnd());
    } else if ("past_due".equalsIgnoreCase(status)) {
      user.revokeOnPaymentFailure(SubscriptionStatus.PAST_DUE);
    } else if ("unpaid".equalsIgnoreCase(status)) {
      user.revokeOnPaymentFailure(SubscriptionStatus.CANCELED);
    } else if ("canceled".equalsIgnoreCase(status)) {
      user.cancelSubscription();
    }

    userRepository.save(user);
    if (founderGranted) {
      evaluateAchievementsIfPresent(user);
    }
    log.info("Status da assinatura do usuário {} atualizado para {} (endsAt: {})",
        user.getId(), user.getSubscriptionStatus(), user.getSubscriptionEndsAt());
    return user.getId();
  }

  private void evaluateAchievementsIfPresent(User user) {
    if (evaluateUserAchievementsUseCase != null) {
      evaluateUserAchievementsUseCase.execute(user);
    }
  }

  private UUID handleSubscriptionDeleted(PaymentWebhookEvent.SubscriptionDeleted subDeleted) {
    log.info("Assinatura cancelada/deletada: id={}", subDeleted.subscriptionId());

    User user = findUserForUpdate(subDeleted.userId(), subDeleted.customerId(), null).orElse(null);
    if (user == null) {
      log.warn("Usuário não encontrado para a assinatura cancelada: {}", subDeleted.subscriptionId());
      return null;
    }

    String currentSubId = user.getStripeSubscriptionId();
    if (currentSubId != null && !currentSubId.isBlank()
        && subDeleted.subscriptionId() != null && !subDeleted.subscriptionId().isBlank()
        && !currentSubId.equals(subDeleted.subscriptionId())) {
      log.info(
          "Ignorando exclusão fora de ordem da assinatura antiga {} do usuário {}; assinatura atual é {}.",
          subDeleted.subscriptionId(), user.getId(), currentSubId);
      return user.getId();
    }

    user.revokeOnPaymentFailure(SubscriptionStatus.CANCELED);
    userRepository.save(user);
    log.info("Assinatura do usuário {} cancelada com sucesso.", user.getId());
    return user.getId();
  }

  private Optional<User> findUserForUpdate(UUID userId, String customerId, String email) {
    if (userId != null) {
      Optional<User> lockedOpt = userRepository.findByIdForUpdate(userId);
      if (lockedOpt.isPresent()) {
        return lockedOpt;
      }
    }

    Optional<User> foundOpt = Optional.empty();
    if (customerId != null && !customerId.isBlank()) {
      foundOpt = userRepository.findByStripeCustomerId(customerId);
    }
    if (foundOpt.isEmpty() && email != null && !email.isBlank()) {
      foundOpt = userRepository.findByEmail(email.trim().toLowerCase());
    }
    if (foundOpt.isPresent() && foundOpt.get().getId() != null) {
      Optional<User> locked = userRepository.findByIdForUpdate(foundOpt.get().getId());
      return locked.isPresent() ? locked : foundOpt;
    }

    return Optional.empty();
  }
}
