package com.habitparty.adapters.in.web.dtos.request;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;

public record UpdateColumnOrderDTO(
  @NotNull UUID board_column_id,
  @NotNull Integer newIndex

) {
  
}
