package com.habitparty.adapters.in.web.dtos.request;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;

public record RedeemRewardRequestDTO(
    @NotNull UUID rewardId) {

}
