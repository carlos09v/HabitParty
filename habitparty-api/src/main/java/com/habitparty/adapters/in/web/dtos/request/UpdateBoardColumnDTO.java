package com.habitparty.adapters.in.web.dtos.request;

import jakarta.validation.constraints.Size;

public record UpdateBoardColumnDTO(
  @Size(min = 1, max = 30, message = "O nome deve ter até 30 caracteres")
  String name,

  String icon
) {
  
}
