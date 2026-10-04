package com.habitparty.adapters.in.web.api;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import com.habitparty.adapters.in.web.dtos.request.CreateRewardDTO;
import com.habitparty.adapters.in.web.dtos.request.RedeemRewardRequestDTO;
import com.habitparty.adapters.in.web.dtos.request.UpdateRewardDTO;
import com.habitparty.adapters.in.web.dtos.request.UpdateRewardOrderDTO;
import com.habitparty.adapters.in.web.dtos.response.RewardResponseDTO;
import com.habitparty.infrastructure.security.AuthenticatedUser;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RequestMapping("/rewards")
@Validated
@Tag(name = "Rewards", description = "Endpoints para gerenciamento e resgate de recompensas")
public interface RewardApi {

    @Operation(summary = "Resgatar Recompensa", description = "Debita moedas do usuário e resgata ou sorteia uma recompensa.")
    @PostMapping("/{rewardId}/redeem")
    ResponseEntity<Void> redeemReward(
        @PathVariable UUID rewardId,
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado
    );

    @Operation(summary = "Criar Recompensa", description = "Cria uma nova recompensa personalizada para o usuário.")
    @PostMapping
    ResponseEntity<RewardResponseDTO> createReward(
        @RequestBody @Valid CreateRewardDTO requestDTO,
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado
    );

    @Operation(summary = "Excluir Recompensa", description = "Remove uma recompensa existente.")
    @DeleteMapping("/{id}")
    ResponseEntity<Void> deleteReward(
        @PathVariable UUID id,
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado
    );

    @Operation(summary = "Reordenar Recompensas", description = "Atualiza a ordem de exibição das recompensas.")
    @PutMapping("/reorder")
    ResponseEntity<Void> updateOrderIndex(
        @RequestBody List<@Valid UpdateRewardOrderDTO> newOrderList,
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado
    );

    @Operation(summary = "Atualizar Recompensa", description = "Modifica detalhes de uma recompensa existente.")
    @PutMapping("/{rewardId}")
    ResponseEntity<RewardResponseDTO> update(
        @PathVariable UUID rewardId,
        @RequestBody @Valid UpdateRewardDTO dto,
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado
    );

    @Operation(summary = "Listar Recompensas", description = "Lista todas as recompensas cadastradas pelo usuário logado.")
    @GetMapping
    ResponseEntity<List<RewardResponseDTO>> getRewardListByUserId(
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado
    );
}
