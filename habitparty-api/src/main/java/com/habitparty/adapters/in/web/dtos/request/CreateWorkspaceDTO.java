package com.habitparty.adapters.in.web.dtos.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateWorkspaceDTO(
  @NotBlank
  @Size(max = 12, message = "O nome deve ter até 12 caracteres")
  String name
) {

} 