package com.habitparty.adapters.in.web;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import com.habitparty.adapters.in.web.api.WebhookApi;
import com.habitparty.application.ports.PaymentGatewayPort;
import com.habitparty.application.ports.PaymentWebhookEvent;
import com.habitparty.application.usecases.payment.ProcessStripeWebhookUseCase;
import com.habitparty.core.exceptions.PaymentProcessingException;

@RestController
public class WebhookController implements WebhookApi {
  private static final Logger log = LoggerFactory.getLogger(WebhookController.class);

  private final PaymentGatewayPort paymentGatewayPort;
  private final ProcessStripeWebhookUseCase processStripeWebhookUseCase;

  public WebhookController(
      PaymentGatewayPort paymentGatewayPort,
      ProcessStripeWebhookUseCase processStripeWebhookUseCase) {
    this.paymentGatewayPort = paymentGatewayPort;
    this.processStripeWebhookUseCase = processStripeWebhookUseCase;
  }

  @Override
  public ResponseEntity<Void> handleStripeWebhook(String payload, String sigHeader) {
    try {
      PaymentWebhookEvent event = paymentGatewayPort.parseWebhookEvent(payload, sigHeader);
      processStripeWebhookUseCase.execute(event);
      return ResponseEntity.ok().build();
    } catch (PaymentProcessingException e) {
      log.warn("Falha ao processar assinatura ou evento do webhook: {}", e.getMessage());
      return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
    } catch (Exception e) {
      log.error("Erro ao processar webhook de pagamento: {}", e.getMessage(), e);
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }
  }
}
