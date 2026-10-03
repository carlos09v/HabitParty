package com.habitparty.adapters.in.web.dtos.request;

import jakarta.validation.constraints.Size;

public record UpdateFocusRecordDTO(
    @Size(max = 500, message = "A anotação não pode ter mais de 500 caracteres.") String notes) {

}
