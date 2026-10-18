package com.habitparty.adapters.in.web.dtos.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequestDTO(
    @Schema(description = "Token de recuperação recebido por e-mail", example = "550e8400-e29b-41d4-a716-446655440000")
    @NotBlank(message = "O token é obrigatório.")
    String token,

    @Schema(description = "Nova senha do usuário (mínimo 8 caracteres, com letra maiúscula e caractere especial)", example = "NovaSenhaForte@123")
    @NotBlank(message = "A nova senha é obrigatória.")
    @Size(min = 8, max = 64, message = "A nova senha deve ter entre 8 e 64 caracteres.")
    @Pattern(
        regexp = "^(?=.*[A-Z])(?=.*[@$!%*?&#]).+$",
        message = "A nova senha deve conter pelo menos uma letra maiúscula e um caractere especial"
    )
    String password
) {}
