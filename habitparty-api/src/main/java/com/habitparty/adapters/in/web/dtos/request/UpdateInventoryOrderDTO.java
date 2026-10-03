package com.habitparty.adapters.in.web.dtos.request;

import java.util.UUID;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record UpdateInventoryOrderDTO(
  @NotNull UUID itemId,

  @NotNull
  @Min(0)
  Integer newIndex
) {
  
}
