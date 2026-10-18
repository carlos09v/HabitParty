package com.habitparty.adapters.in.web.api;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

import com.habitparty.adapters.in.web.dtos.request.CheckoutRequestDTO;
import com.habitparty.adapters.in.web.dtos.response.CheckoutResponseDTO;
import com.habitparty.infrastructure.security.AuthenticatedUser;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RequestMapping("/api/v1/payments")
@Tag(name = "Payments", description = "Endpoints para pagamentos, checkout e assinaturas via Stripe")
public interface PaymentApi {

  @Operation(
      summary = "Criar Sessão de Checkout",
      description = "Cria uma sessão no Stripe Checkout para assinatura recorrente (cartão) ou pagamento avulso (Pix)."
  )
  @PostMapping("/checkout")
  ResponseEntity<CheckoutResponseDTO> createCheckoutSession(
      @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
      @Valid @RequestBody CheckoutRequestDTO request);

  @Operation(
      summary = "Acessar Portal do Cliente",
      description = "Gera a URL segura do Stripe Customer Portal para o usuário gerenciar suas assinaturas, formas de pagamento e cancelamentos."
  )
  @PostMapping("/portal")
  ResponseEntity<com.habitparty.adapters.in.web.dtos.response.CustomerPortalResponseDTO> createCustomerPortalSession(
      @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser authenticatedUser);

  @Operation(
      summary = "Consultar Vagas de Membro Fundador",
      description = "Retorna a quantidade total, preenchida e restante das 30 vagas da promoção de lançamento."
  )
  @org.springframework.web.bind.annotation.GetMapping("/founders-quota")
  ResponseEntity<com.habitparty.adapters.in.web.dtos.response.FoundersQuotaDTO> getFoundersQuota();

  @Operation(
      summary = "Confirmar Pagamento de Checkout",
      description = "Verifica no gateway se a sessão de checkout indicada foi paga e ativa o plano do usuário imediatamente."
  )
  @PostMapping("/confirm")
  ResponseEntity<com.habitparty.adapters.in.web.dtos.response.PaymentConfirmResponseDTO> confirmCheckout(
      @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
      @Valid @RequestBody com.habitparty.adapters.in.web.dtos.request.PaymentConfirmRequestDTO request);
}
