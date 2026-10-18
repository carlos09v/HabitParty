package com.habitparty.adapters.in.web;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import com.habitparty.adapters.in.web.api.PaymentApi;
import com.habitparty.adapters.in.web.dtos.request.CheckoutRequestDTO;
import com.habitparty.adapters.in.web.dtos.response.CheckoutResponseDTO;
import com.habitparty.adapters.in.web.dtos.response.CustomerPortalResponseDTO;
import com.habitparty.application.usecases.payment.CreateCheckoutSessionUseCase;
import com.habitparty.application.usecases.payment.CreateCustomerPortalSessionUseCase;
import com.habitparty.infrastructure.security.AuthenticatedUser;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@RestController
public class PaymentController implements PaymentApi {

  private final CreateCheckoutSessionUseCase createCheckoutSessionUseCase;
  private final CreateCustomerPortalSessionUseCase createCustomerPortalSessionUseCase;
  private final com.habitparty.application.usecases.payment.GetFoundersQuotaUseCase getFoundersQuotaUseCase;
  private final com.habitparty.application.usecases.payment.ConfirmCheckoutSessionUseCase confirmCheckoutSessionUseCase;

  @Override
  public ResponseEntity<CheckoutResponseDTO> createCheckoutSession(
      AuthenticatedUser authenticatedUser,
      CheckoutRequestDTO request) {
    String checkoutUrl = createCheckoutSessionUseCase.execute(
        authenticatedUser.id(),
        request.plan(),
        request.paymentMethod());

    return ResponseEntity.ok(new CheckoutResponseDTO(checkoutUrl));
  }

  @Override
  public ResponseEntity<CustomerPortalResponseDTO> createCustomerPortalSession(
      AuthenticatedUser authenticatedUser) {
    String portalUrl = createCustomerPortalSessionUseCase.execute(
        authenticatedUser.id(),
        null);

    return ResponseEntity.ok(new CustomerPortalResponseDTO(portalUrl));
  }

  @Override
  public ResponseEntity<com.habitparty.adapters.in.web.dtos.response.FoundersQuotaDTO> getFoundersQuota() {
    return ResponseEntity.ok(getFoundersQuotaUseCase.execute());
  }

  @Override
  public ResponseEntity<com.habitparty.adapters.in.web.dtos.response.PaymentConfirmResponseDTO> confirmCheckout(
      AuthenticatedUser authenticatedUser,
      com.habitparty.adapters.in.web.dtos.request.PaymentConfirmRequestDTO request) {
    java.util.Optional<com.habitparty.core.domain.entities.User> userOpt =
        confirmCheckoutSessionUseCase.execute(authenticatedUser.id(), request.sessionId());

    if (userOpt.isPresent() && userOpt.get().isPremium()) {
      return ResponseEntity.ok(new com.habitparty.adapters.in.web.dtos.response.PaymentConfirmResponseDTO(
          true,
          "Pagamento confirmado com sucesso!",
          com.habitparty.adapters.in.web.dtos.response.UserResponseDTO.fromDomain(userOpt.get())));
    }

    return ResponseEntity.ok(new com.habitparty.adapters.in.web.dtos.response.PaymentConfirmResponseDTO(
        false,
        "Aguardando compensação do pagamento pelo gateway.",
        null));
  }
}
