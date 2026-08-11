package com.habitparty.adapters.in.web.dtos.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record SignInRequestDTO(
    @NotBlank(message = "O e-mail é obrigatório") @Email(message = "Formato de e-mail inválido") String email,

    @NotBlank(message = "A senha é obrigatória") String password
) {

}
