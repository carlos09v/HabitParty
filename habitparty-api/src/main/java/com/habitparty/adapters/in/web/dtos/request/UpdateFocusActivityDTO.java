package com.habitparty.adapters.in.web.dtos.request;

import com.habitparty.core.domain.enums.FocusRecordType;

import jakarta.validation.constraints.Size;

public record UpdateFocusActivityDTO(
        @Size(max = 30, message = "O nome deve ter até 30 caracteres") String name,

        @Size(max = 10, message = "O icone deve ter até 10 caracteres") String icon,
        FocusRecordType recordType,
        Integer pomoTimeMinutes

) {

}
