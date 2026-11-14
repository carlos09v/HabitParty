package com.habitparty.adapters.in.web.dtos.request.social;

import jakarta.validation.constraints.NotNull;

public record RespondFriendRequestDTO(
    @NotNull(message = "A decisão (aceitar ou recusar) é obrigatória.")
    Boolean accept) {
}
