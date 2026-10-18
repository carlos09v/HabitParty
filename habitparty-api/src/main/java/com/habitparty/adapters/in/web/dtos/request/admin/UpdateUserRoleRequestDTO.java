package com.habitparty.adapters.in.web.dtos.request.admin;

import com.habitparty.core.domain.enums.UserRole;

import jakarta.validation.constraints.NotNull;

public record UpdateUserRoleRequestDTO(
    @NotNull(message = "A role é obrigatória.")
    UserRole role
) {}
