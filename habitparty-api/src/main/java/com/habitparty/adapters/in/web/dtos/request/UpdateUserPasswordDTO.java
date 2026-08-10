package com.habitparty.adapters.in.web.dtos.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateUserPasswordDTO(
    @NotBlank(message = "A senha atual é obrigatória") String currentPassword,

    @NotBlank(message = "A nova senha é obrigatória") @Size(min = 8, max = 64, message = "A nova senha deve ter entre 8 e 64 caracteres")
    @Pattern(
        regexp = "^(?=.*[A-Z])(?=.*[@$!%*?&#]).+$",
        message = "A nova senha deve conter pelo menos uma letra maiúscula e um caractere especial"
    )
    String newPassword
) {

}
