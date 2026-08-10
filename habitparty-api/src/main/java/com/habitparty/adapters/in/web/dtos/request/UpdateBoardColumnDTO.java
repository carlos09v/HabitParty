package com.habitparty.adapters.in.web.dtos.request;

import jakarta.validation.constraints.Size;

public record UpdateBoardColumnDTO(
  @Size(min = 1, max = 12, message = "O nome deve ter até 12 caracteres")
  String name,

  String icon
) {
  
}
