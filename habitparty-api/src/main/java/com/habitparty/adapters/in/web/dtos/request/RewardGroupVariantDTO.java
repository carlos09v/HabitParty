package com.habitparty.adapters.in.web.dtos.request;

import java.math.BigDecimal;
import java.util.UUID;

import com.habitparty.core.domain.enums.RewardPackageLevel;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record RewardGroupVariantDTO(
    UUID id,

    @NotBlank(message = "O nome do pacote é obrigatório")
    @Size(max = 30, message = "O nome deve ter até 30 caracteres")
    String name,

    @NotNull(message = "O preço é obrigatório")
    @Positive(message = "O preço deve ser maior que zero")
    BigDecimal price,

    RewardPackageLevel packageLevel,

    Integer baseDurationMinutes
) {}
