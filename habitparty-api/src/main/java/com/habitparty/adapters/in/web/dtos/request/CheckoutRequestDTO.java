package com.habitparty.adapters.in.web.dtos.request;

import com.habitparty.core.domain.enums.PaymentMethodType;
import com.habitparty.core.domain.enums.PlanType;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

public record CheckoutRequestDTO(
    @NotNull(message = "O plano é obrigatório (MONTHLY ou ANNUAL).")
    @Schema(description = "Tipo de plano escolhido", example = "MONTHLY")
    PlanType plan,

    @NotNull(message = "O método de pagamento é obrigatório (CREDIT_CARD ou PIX).")
    @Schema(description = "Forma de pagamento (CREDIT_CARD para recorrência ou PIX para avulso)", example = "CREDIT_CARD")
    PaymentMethodType paymentMethod
) {}
