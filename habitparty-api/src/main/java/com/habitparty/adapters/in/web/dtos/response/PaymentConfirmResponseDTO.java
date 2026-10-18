package com.habitparty.adapters.in.web.dtos.response;

public record PaymentConfirmResponseDTO(
    boolean isPaid,
    String message,
    UserResponseDTO user
) {}
