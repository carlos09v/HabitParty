package com.habitparty.adapters.in.web.api;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RequestMapping("/api/v1/webhooks")
@Tag(name = "Webhooks", description = "Endpoints de recebimento de webhooks externos")
public interface WebhookApi {

  @Operation(
      summary = "Webhook do Stripe",
      description = "Recebe eventos do Stripe assinados e processa ativação de assinaturas e pagamentos Pix."
  )
  @PostMapping("/stripe")
  ResponseEntity<Void> handleStripeWebhook(
      @RequestBody String payload,
      @RequestHeader("Stripe-Signature") String sigHeader);
}
