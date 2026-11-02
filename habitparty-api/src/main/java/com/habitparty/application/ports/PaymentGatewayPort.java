package com.habitparty.application.ports;

import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.enums.PaymentMethodType;
import com.habitparty.core.domain.enums.PlanType;

public interface PaymentGatewayPort {
  /**
   * Obtém ou cria o cliente correspondente no gateway de pagamento.
   */
  String createOrGetCustomer(User user);

  /**
   * Cria uma sessão de Checkout usando URLs padrão do gateway (idioma padrão pt-BR).
   */
  String createCheckoutSession(
      User user,
      PlanType plan,
      PaymentMethodType paymentMethod,
      String customerId);

  /**
   * Cria uma sessão de Checkout usando URLs padrão do gateway e o idioma/moeda do usuário.
   */
  default String createCheckoutSession(
      User user,
      PlanType plan,
      PaymentMethodType paymentMethod,
      String customerId,
      String locale) {
    return createCheckoutSession(user, plan, paymentMethod, customerId);
  }

  /**
   * Cria uma sessão de Checkout com URLs explícitas.
   */
  String createCheckoutSession(
      User user,
      PlanType plan,
      PaymentMethodType paymentMethod,
      String customerId,
      String successUrl,
      String cancelUrl);

  /**
   * Cria uma sessão de Checkout com URLs explícitas e idioma/moeda do usuário.
   */
  default String createCheckoutSession(
      User user,
      PlanType plan,
      PaymentMethodType paymentMethod,
      String customerId,
      String successUrl,
      String cancelUrl,
      String locale) {
    return createCheckoutSession(user, plan, paymentMethod, customerId, successUrl, cancelUrl);
  }

  /**
   * Valida a assinatura e decodifica o payload do webhook em um evento de domínio.
   */
  PaymentWebhookEvent parseWebhookEvent(String payload, String signatureHeader);

  /**
   * Cria uma sessão no Stripe Customer Portal para gerenciamento de assinaturas e cancelamento.
   */
  String createCustomerPortalSession(User user, String returnUrl);

  /**
   * Consulta e retorna os dados de uma sessão de checkout diretamente no gateway caso esteja paga.
   */
  java.util.Optional<PaymentWebhookEvent.CheckoutCompleted> retrievePaidCheckoutSession(String sessionId);
}
