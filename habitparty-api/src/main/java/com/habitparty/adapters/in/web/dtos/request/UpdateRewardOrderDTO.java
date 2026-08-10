package com.habitparty.adapters.in.web.dtos.request;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;

public record UpdateRewardOrderDTO(
    @NotNull UUID reward_id,
    @NotNull Integer newIndex
) {

}
