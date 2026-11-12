package com.habitparty.adapters.in.web.dtos.request;

import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record DeleteTransactionsBatchDTO(
    @NotEmpty(message = "Selecione ao menos um registro para excluir.")
    @Size(max = 200, message = "Limite de 200 registros por exclusão em lote.")
    List<@NotNull UUID> ids
) {
}
