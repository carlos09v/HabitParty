package com.habitparty.adapters.in.web.dtos.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateWorkspaceDTO(
  @NotBlank(message = "O nome não pode ser vazio")
  @Size(max = 25, message = "O nome deve ter até 25 caracteres")
  String name
) {
  
}
