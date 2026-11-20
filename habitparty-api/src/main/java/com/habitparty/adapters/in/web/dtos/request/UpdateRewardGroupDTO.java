package com.habitparty.adapters.in.web.dtos.request;

import java.util.List;
import java.util.UUID;

import com.habitparty.core.domain.enums.RewardCategory;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateRewardGroupDTO(
    @NotEmpty(message = "Informe ao menos uma recompensa de origem")
    List<@NotNull UUID> sourceRewardIds,

    @NotBlank(message = "O nome base é obrigatório")
    @Size(max = 30, message = "O nome base deve ter até 30 caracteres")
    String baseName,

    @Size(max = 20, message = "O ícone deve ter até 20 caracteres")
    String icon,

    @Size(max = 140, message = "A descrição deve ter até 140 caracteres")
    String description,

    RewardCategory category,

    List<String> tags,

    @NotEmpty(message = "O card deve possuir ao menos um pacote")
    @Size(max = 4, message = "Um card pode ter no máximo 4 pacotes")
    List<@Valid RewardGroupVariantDTO> variants,

    boolean deleteRemovedHistory
) {}
