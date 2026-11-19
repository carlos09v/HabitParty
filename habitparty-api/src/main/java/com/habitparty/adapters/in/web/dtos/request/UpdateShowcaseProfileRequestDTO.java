package com.habitparty.adapters.in.web.dtos.request;

import jakarta.validation.constraints.Size;

public record UpdateShowcaseProfileRequestDTO(
    @Size(max = 160, message = "A bio do perfil deve ter no máximo 160 caracteres.")
    String bio,

    @Size(max = 40, message = "O identificador da moldura deve ter no máximo 40 caracteres.")
    String avatarFrame,

    @Size(max = 60, message = "O identificador do título deve ter no máximo 60 caracteres.")
    String equippedTitle,

    @Size(max = 40, message = "O identificador do avatar deve ter no máximo 40 caracteres.")
    String avatarPreset) {}
