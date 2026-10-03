package com.habitparty.adapters.in.web.dtos.request;

import java.util.UUID;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record UpdateFocusActivityOrderDTO(
    @NotNull
    UUID id,

    @NotNull
    @Min(0)
    int orderIndex) {

}
