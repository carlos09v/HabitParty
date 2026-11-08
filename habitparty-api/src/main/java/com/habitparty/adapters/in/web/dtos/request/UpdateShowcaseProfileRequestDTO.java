package com.habitparty.adapters.in.web.dtos.request;

import jakarta.validation.constraints.Size;

public record UpdateShowcaseProfileRequestDTO(
    @Size(max = 160, message = "A bio do perfil deve ter no máximo 160 caracteres.")
    String bio,

    @Size(max = 40, message = "O identificador da moldura deve ter no máximo 40 caracteres.")
    String avatarFrame) {}
