package com.habitparty.adapters.in.web.dtos.request;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;

public record MoveBoardColumnDTO(
    @NotNull(message = "O id do Workspace de destino é obrigatório")
    UUID targetWorkspaceId
) {
}
