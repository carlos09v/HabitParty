package com.habitparty.adapters.in.web.dtos.request;

import com.habitparty.core.domain.enums.FocusRecordType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateFocusActivityDTO(
    @NotBlank(message = "O nome é obrigatório") @Size(max = 30, message = "O nome deve ter até 30 caracteres") String name,

    @NotBlank(message = "O ícone é obrigatório") @Size(max = 10, message = "O icone deve ter até 10 caracteres") String icon,

    @NotNull(message = "O tipo é obrigatório") FocusRecordType recordType,

    Integer targetTimeMinutes) {

}
