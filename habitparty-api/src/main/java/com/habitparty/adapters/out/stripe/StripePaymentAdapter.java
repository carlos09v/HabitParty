package com.habitparty.adapters.out.stripe;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.habitparty.application.ports.PaymentGatewayPort;
import com.habitparty.application.ports.PaymentWebhookEvent;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.enums.PaymentMethodType;
import com.habitparty.core.domain.enums.PlanType;
import com.habitparty.core.exceptions.PaymentProcessingException;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Customer;
import com.stripe.model.CustomerSearchResult;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.StripeObject;
import com.stripe.model.Subscription;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.CustomerCreateParams;
import com.stripe.param.CustomerSearchParams;
import com.stripe.param.checkout.SessionCreateParams;

@Component
public class StripePaymentAdapter implements PaymentGatewayPort {
  private static final Logger log = LoggerFactory.getLogger(StripePaymentAdapter.class);

  @Value("${stripe.prices.monthly:}")
  private String monthlyPriceId;

  @Value("${stripe.prices.annual:}")
  private String annualPriceId;

  @Value("${stripe.prices.founder-annual:}")
  private String founderAnnualPriceId;

  @Value("${stripe.success.url:${APP_FRONTEND_URL:http://localhost:3000}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}}")
  private String defaultSuccessUrl;

  @Value("${stripe.cancel.url:${APP_FRONTEND_URL:http://localhost:3000}/dashboard?payment=cancel}")
  private String defaultCancelUrl;

  @Value("${app.frontend-url:${APP_FRONTEND_URL:http://localhost:3000}}")
  private String frontendUrl;

  @Value("${stripe.webhook.secret:}")
  private String webhookSecret;

  @Override
  public String createOrGetCustomer(User user) {
    try {
      if (user.getStripeCustomerId() != null && !user.getStripeCustomerId().isBlank()) {
        try {
          Customer existing = Customer.retrieve(user.getStripeCustomerId());
          if (existing != null && (existing.getDeleted() == null || !existing.getDeleted())) {
            return existing.getId();
          }
        } catch (StripeException ignored) {
        }
      }

      try {
        CustomerSearchResult searchResult = Customer.search(
            CustomerSearchParams.builder()
                .setQuery("email:'" + user.getEmail() + "'")
                .build());
        if (searchResult.getData() != null && !searchResult.getData().isEmpty()) {
          return searchResult.getData().get(0).getId();
        }
      } catch (StripeException ignored) {
      }

      CustomerCreateParams params = CustomerCreateParams.builder()
          .setEmail(user.getEmail())
          .setName(user.getFullName())
          .putMetadata("userId", user.getId().toString())
          .putMetadata("username", user.getUsername())
          .build();

      Customer customer = Customer.create(params);
      return customer.getId();
    } catch (StripeException e) {
      throw new PaymentProcessingException(
          "Falha ao comunicar com o Stripe ao criar/buscar cliente: " + e.getMessage(), e);
    }
  }

  @Override
  public String createCheckoutSession(
      User user,
      PlanType plan,
      PaymentMethodType paymentMethod,
      String customerId) {
    return createCheckoutSession(user, plan, paymentMethod, customerId, defaultSuccessUrl, defaultCancelUrl);
  }

  @Override
  public String createCheckoutSession(
      User user,
      PlanType plan,
      PaymentMethodType paymentMethod,
      String customerId,
      String successUrl,
      String cancelUrl) {
    try {
      String effectiveSuccessUrl = (successUrl != null && !successUrl.isBlank()) ? successUrl : defaultSuccessUrl;
      if (!effectiveSuccessUrl.contains("session_id=")) {
        effectiveSuccessUrl += (effectiveSuccessUrl.contains("?") ? "&" : "?") + "session_id={CHECKOUT_SESSION_ID}";
      }

      SessionCreateParams.Builder sessionBuilder = SessionCreateParams.builder()
          .setCustomer(customerId)
          .setClientReferenceId(user.getId().toString())
          .putMetadata("userId", user.getId().toString())
          .putMetadata("plan", plan.name())
          .putMetadata("paymentType", paymentMethod.name())
          .setSuccessUrl(effectiveSuccessUrl)
          .setCancelUrl(cancelUrl != null ? cancelUrl : defaultCancelUrl);

      if (plan == PlanType.FOUNDER_ANNUAL) {
        sessionBuilder.putMetadata("isFounder", "true");
      }

      if (paymentMethod == PaymentMethodType.PIX) {
        int days = (plan == PlanType.ANNUAL || plan == PlanType.FOUNDER_ANNUAL) ? 365 : 30;
        long amountInCents = switch (plan) {
          case FOUNDER_ANNUAL -> 5990L;
          case ANNUAL -> 9900L;
          case MONTHLY -> 990L;
        };
        String planTitle = switch (plan) {
          case FOUNDER_ANNUAL -> "Membro Fundador Anual (365 Dias)";
          case ANNUAL -> "Anual (365 Dias)";
          case MONTHLY -> "Mensal (30 Dias)";
        };

        com.stripe.param.checkout.SessionCreateParams.PaymentIntentData.Builder piBuilder =
            SessionCreateParams.PaymentIntentData.builder()
                .putMetadata("userId", user.getId().toString())
                .putMetadata("plan", plan.name())
                .putMetadata("paymentType", "PIX")
                .putMetadata("days", String.valueOf(days));

        if (plan == PlanType.FOUNDER_ANNUAL) {
          piBuilder.putMetadata("isFounder", "true");
        }

        sessionBuilder
            .setMode(SessionCreateParams.Mode.PAYMENT)
            .addPaymentMethodType(SessionCreateParams.PaymentMethodType.PIX)
            .putMetadata("days", String.valueOf(days))
            .setPaymentIntentData(piBuilder.build())
            .addLineItem(
                SessionCreateParams.LineItem.builder()
                    .setQuantity(1L)
                    .setPriceData(
                        SessionCreateParams.LineItem.PriceData.builder()
                            .setCurrency("brl")
                            .setUnitAmount(amountInCents)
                            .setProductData(
                                SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                    .setName("HabitParty " + planTitle)
                                    .setDescription(plan == PlanType.FOUNDER_ANNUAL
                                        ? "Acesso Premium Anual com Insígnia Vitalícia de Membro Fundador via Pix"
                                        : "Acesso Premium avulso via Pix por " + days + " dias")
                                    .build())
                            .build())
                    .build());
      } else {
        com.stripe.param.checkout.SessionCreateParams.SubscriptionData.Builder subBuilder =
            SessionCreateParams.SubscriptionData.builder()
                .putMetadata("userId", user.getId().toString())
                .putMetadata("plan", plan.name());

        if (plan == PlanType.FOUNDER_ANNUAL) {
          subBuilder.putMetadata("isFounder", "true");
        }

        sessionBuilder
            .setMode(SessionCreateParams.Mode.SUBSCRIPTION)
            .addPaymentMethodType(SessionCreateParams.PaymentMethodType.CARD)
            .setSubscriptionData(subBuilder.build());

        String configuredPriceId = switch (plan) {
          case FOUNDER_ANNUAL -> founderAnnualPriceId;
          case ANNUAL -> annualPriceId;
          case MONTHLY -> monthlyPriceId;
        };

        if (configuredPriceId != null && !configuredPriceId.isBlank() && configuredPriceId.startsWith("price_") && !configuredPriceId.contains("...")) {
          sessionBuilder.addLineItem(
              SessionCreateParams.LineItem.builder()
                  .setPrice(configuredPriceId)
                  .setQuantity(1L)
                  .build());
        } else {
          SessionCreateParams.LineItem.PriceData.Recurring.Interval interval =
              (plan == PlanType.ANNUAL || plan == PlanType.FOUNDER_ANNUAL)
                  ? SessionCreateParams.LineItem.PriceData.Recurring.Interval.YEAR
                  : SessionCreateParams.LineItem.PriceData.Recurring.Interval.MONTH;

          long amountInCents = switch (plan) {
            case FOUNDER_ANNUAL -> 5990L;
            case ANNUAL -> 9900L;
            case MONTHLY -> 990L;
          };
          String planTitle = switch (plan) {
            case FOUNDER_ANNUAL -> "Membro Fundador (Anual)";
            case ANNUAL -> "Anual";
            case MONTHLY -> "Mensal";
          };
          String planDescription = plan == PlanType.FOUNDER_ANNUAL
              ? "Assinatura Anual Especial com Insígnia Vitalícia de Membro Fundador"
              : "Assinatura recorrente com renovação automática";

          sessionBuilder.addLineItem(
              SessionCreateParams.LineItem.builder()
                  .setQuantity(1L)
                  .setPriceData(
                      SessionCreateParams.LineItem.PriceData.builder()
                          .setCurrency("brl")
                          .setUnitAmount(amountInCents)
                          .setRecurring(
                              SessionCreateParams.LineItem.PriceData.Recurring.builder()
                                  .setInterval(interval)
                                  .build())
                          .setProductData(
                              SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                  .setName("HabitParty Premium (" + planTitle + ")")
                                  .setDescription(planDescription)
                                  .build())
                          .build())
                  .build());
        }
      }

      Session session = Session.create(sessionBuilder.build());
      return session.getUrl();
    } catch (StripeException e) {
      throw new PaymentProcessingException(
          "Falha ao criar sessão de checkout no Stripe: " + e.getMessage(), e);
    }
  }

  @Override
  public String createCustomerPortalSession(User user, String returnUrl) {
    try {
      String customerId = createOrGetCustomer(user);
      String finalReturnUrl = (returnUrl != null && !returnUrl.isBlank())
          ? returnUrl
          : frontendUrl + "/settings?tab=profile";

      com.stripe.param.billingportal.SessionCreateParams params =
          com.stripe.param.billingportal.SessionCreateParams.builder()
              .setCustomer(customerId)
              .setReturnUrl(finalReturnUrl)
              .build();

      com.stripe.model.billingportal.Session portalSession =
          com.stripe.model.billingportal.Session.create(params);
      return portalSession.getUrl();
    } catch (StripeException e) {
      throw new PaymentProcessingException(
          "Falha ao gerar sessão do portal de cliente Stripe: " + e.getMessage(), e);
    }
  }

  @Override
  public java.util.Optional<PaymentWebhookEvent.CheckoutCompleted> retrievePaidCheckoutSession(String sessionId) {
    if (sessionId == null || sessionId.isBlank()) {
      return java.util.Optional.empty();
    }
    try {
      Session session = Session.retrieve(sessionId);
      if (session != null && "paid".equalsIgnoreCase(session.getPaymentStatus())) {
        return java.util.Optional.of((PaymentWebhookEvent.CheckoutCompleted) mapCheckoutSession("direct_verify_" + session.getId(), session));
      }
      return java.util.Optional.empty();
    } catch (StripeException e) {
      log.warn("Erro ao buscar sessão de checkout {} no Stripe: {}", sessionId, e.getMessage());
      return java.util.Optional.empty();
    }
  }

  @Override
  public PaymentWebhookEvent parseWebhookEvent(String payload, String signatureHeader) {
    if (signatureHeader == null || signatureHeader.isBlank()) {
      throw new PaymentProcessingException("Cabeçalho Stripe-Signature ausente na requisição de webhook");
    }

    if (webhookSecret == null || webhookSecret.isBlank()) {
      throw new PaymentProcessingException("STRIPE_WEBHOOK_SECRET não configurado no servidor.");
    }

    Event event;
    try {
      event = Webhook.constructEvent(payload, signatureHeader, webhookSecret);
    } catch (SignatureVerificationException e) {
      throw new PaymentProcessingException("Assinatura do webhook Stripe inválida: " + e.getMessage(), e);
    } catch (Exception e) {
      throw new PaymentProcessingException("Erro ao validar webhook Stripe: " + e.getMessage(), e);
    }

    EventDataObjectDeserializer deserializer = event.getDataObjectDeserializer();
    StripeObject stripeObject = deserializer.getObject().orElseGet(() -> {
      try {
        return deserializer.deserializeUnsafe();
      } catch (Exception e) {
        log.warn("Não foi possível desserializar o objeto do evento de forma segura: {}", e.getMessage());
        return null;
      }
    });

    if (stripeObject == null) {
      return new PaymentWebhookEvent.IgnoredEvent(event.getId(), event.getType());
    }

    return switch (event.getType()) {
      case "checkout.session.completed" -> mapCheckoutSession(event.getId(), (Session) stripeObject);
      case "customer.subscription.created", "customer.subscription.updated" ->
          mapSubscriptionUpdated(event.getId(), (Subscription) stripeObject);
      case "customer.subscription.deleted" ->
          mapSubscriptionDeleted(event.getId(), (Subscription) stripeObject);
      default -> new PaymentWebhookEvent.IgnoredEvent(event.getId(), event.getType());
    };
  }

  private PaymentWebhookEvent mapCheckoutSession(String eventId, Session session) {
    UUID userId = extractUserId(session.getClientReferenceId(), session.getMetadata());
    String email = session.getCustomerDetails() != null ? session.getCustomerDetails().getEmail() : null;
    int days = 30;
    if (session.getMetadata() != null && session.getMetadata().containsKey("days")) {
      try {
        days = Integer.parseInt(session.getMetadata().get("days"));
      } catch (NumberFormatException ignored) {
      }
    }

    return new PaymentWebhookEvent.CheckoutCompleted(
        eventId,
        session.getId(),
        session.getMode(),
        session.getCustomer(),
        session.getSubscription(),
        userId,
        email,
        days,
        session.getMetadata()
    );
  }

  private PaymentWebhookEvent mapSubscriptionUpdated(String eventId, Subscription subscription) {
    UUID userId = extractUserId(null, subscription.getMetadata());
    LocalDateTime periodEnd = null;
    if (subscription.getCurrentPeriodEnd() != null) {
      periodEnd = LocalDateTime.ofInstant(
          Instant.ofEpochSecond(subscription.getCurrentPeriodEnd()),
          ZoneId.systemDefault());
    }

    return new PaymentWebhookEvent.SubscriptionUpdated(
        eventId,
        subscription.getId(),
        subscription.getCustomer(),
        userId,
        periodEnd,
        subscription.getStatus(),
        subscription.getMetadata()
    );
  }

  private PaymentWebhookEvent mapSubscriptionDeleted(String eventId, Subscription subscription) {
    UUID userId = extractUserId(null, subscription.getMetadata());
    return new PaymentWebhookEvent.SubscriptionDeleted(
        eventId,
        subscription.getId(),
        subscription.getCustomer(),
        userId,
        subscription.getMetadata()
    );
  }

  private UUID extractUserId(String clientReferenceId, Map<String, String> metadata) {
    if (clientReferenceId != null && !clientReferenceId.isBlank()) {
      try {
        return UUID.fromString(clientReferenceId);
      } catch (IllegalArgumentException ignored) {
      }
    }
    if (metadata != null && metadata.containsKey("userId")) {
      try {
        return UUID.fromString(metadata.get("userId"));
      } catch (IllegalArgumentException ignored) {
      }
    }
    return null;
  }
}
