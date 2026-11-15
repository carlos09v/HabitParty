package com.habitparty.adapters.in.web.dtos.request.user;

import com.habitparty.core.domain.enums.AccountResetScope;

import jakarta.validation.constraints.NotNull;

public record ResetAccountDTO(
    @NotNull(message = "O escopo do reset é obrigatório.")
    AccountResetScope scope) {
}
