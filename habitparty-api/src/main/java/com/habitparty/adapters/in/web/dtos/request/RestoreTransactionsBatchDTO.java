package com.habitparty.adapters.in.web.dtos.request;

import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RestoreTransactionsBatchDTO(
    @NotEmpty(message = "Selecione ao menos um registro para restaurar.")
    @Size(max = 200, message = "Limite de 200 registros por restauração em lote.")
    List<@NotNull UUID> ids
) {
}
