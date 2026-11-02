package com.habitparty.adapters.in.web.dtos.request;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateBoardColumnDTO(
  @NotNull(message = "O id do Workspace é obrigatório")
  UUID workspaceId,

  @NotBlank(message = "O nome é obrigatório")
  @Size(max = 30, message = "O nome deve ter até 30 caracteres")
  String name,

  String icon
) {
}
