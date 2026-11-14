package com.habitparty.adapters.in.web.dtos.request.social;

import jakarta.validation.constraints.Size;

public record SendFriendRequestDTO(
    @Size(max = 50, message = "O nome de usuário deve ter no máximo 50 caracteres.")
    String username,

    @Size(max = 12, message = "O código de amigo deve ter no máximo 12 caracteres.")
    String friendCode) {
}
