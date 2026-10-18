package com.habitparty.adapters.in.web.dtos.response;

import io.swagger.v3.oas.annotations.media.Schema;

public record CheckoutResponseDTO(
    @Schema(description = "URL para redirecionamento do Stripe Checkout", example = "https://checkout.stripe.com/c/pay/cs_test_...")
    String checkoutUrl
) {}
