package com.habitparty.application.usecases.payment;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.habitparty.application.ports.PaymentGatewayPort;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.enums.PaymentMethodType;
import com.habitparty.core.domain.enums.PlanType;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class CreateCheckoutSessionUseCase {
  private final UserRepository userRepository;
  private final PaymentGatewayPort paymentGatewayPort;

  public CreateCheckoutSessionUseCase(
      UserRepository userRepository,
      PaymentGatewayPort paymentGatewayPort) {
    this.userRepository = userRepository;
    this.paymentGatewayPort = paymentGatewayPort;
  }

  public String execute(UUID userId, PlanType plan, PaymentMethodType paymentMethod) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

    // Impede assinaturas duplicadas no cartão se já houver uma assinatura recorrente ativa
    if (user.hasActiveRecurringSubscription() && paymentMethod == PaymentMethodType.CREDIT_CARD) {
      throw new com.habitparty.core.exceptions.DomainValidationException(
          "Você já possui uma assinatura ativa via Cartão de Crédito! Para gerenciar seu plano ou forma de pagamento, utilize o Portal da sua conta.");
    }

    // Impede novas adesões ao plano de Membro Fundador se o lote de 30 vagas já estiver esgotado
    if (plan == PlanType.FOUNDER_ANNUAL && userRepository.countFounders() >= GetFoundersQuotaUseCase.MAX_FOUNDER_SLOTS) {
      throw new com.habitparty.core.exceptions.DomainValidationException(
          "O lote promocional de Membros Fundadores (30 vagas) já foi esgotado! Aproveite o plano Anual regular.");
    }

    // Garante que o usuário possua Customer correspondente no gateway de pagamento
    String customerId = paymentGatewayPort.createOrGetCustomer(user);
    if (user.getStripeCustomerId() == null || !user.getStripeCustomerId().equals(customerId)) {
      user.setStripeCustomerId(customerId);
      userRepository.save(user);
    }

    // Gera a URL do Checkout via porta desacoplada
    return paymentGatewayPort.createCheckoutSession(
        user,
        plan,
        paymentMethod,
        customerId);
  }
}
