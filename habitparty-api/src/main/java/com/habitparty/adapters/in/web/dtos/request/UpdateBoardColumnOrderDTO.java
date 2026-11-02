package com.habitparty.adapters.in.web.dtos.request;

import java.util.UUID;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record UpdateBoardColumnOrderDTO(
  @NotNull UUID board_column_id,
  @NotNull @Min(0) Integer newIndex
) {}
