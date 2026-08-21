package com.habitparty.adapters.in.web.dtos.request;

import java.time.LocalDate;

import com.habitparty.core.domain.enums.UserGender;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;


// O Record já cria os getters automaticamente por baixo dos panos!
public record CreateUserDTO(
    @NotBlank(message = "O nome não pode estar em branco")
    String fullName,

    @NotBlank
    @Size(min = 3, max = 12, message = "O username deve ter entre 3 e 12 caracteres")
    String username,

    @NotBlank
    @Email(message = "O formato do e-mail é inválido")
    String email,

    @NotBlank
    @Size(min = 8, max = 64, message = "A senha deve ter entre 8 e 20 caracteres")
    @Pattern(
        regexp = "^(?=.*[A-Z])(?=.*[@$!%*?&#]).+$",
        message = "A nova senha deve conter pelo menos uma letra maiúscula e um caractere especial"
    )
    String password,

    @NotNull(message = "O gênero é obrigatório")
    UserGender gender,

    @NotNull(message = "A data de nascimento é obrigatória")
    @Past(message = "A data de nascimento deve estar no passado")
    LocalDate birthday
) {
    // Repare que NÃO colocamos ID, money, profile_photo_url ou created_at aqui.
    // O usuário não envia o próprio ID ou Saldo na hora de se cadastrar!
}