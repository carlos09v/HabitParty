package com.habitparty.adapters.in.web.api;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import com.habitparty.adapters.in.web.dtos.request.CreateRewardDTO;
import com.habitparty.adapters.in.web.dtos.request.UpdateRewardDTO;
import com.habitparty.adapters.in.web.dtos.request.UpdateRewardGroupDTO;
import com.habitparty.adapters.in.web.dtos.request.UpdateRewardOrderDTO;
import com.habitparty.adapters.in.web.dtos.response.RewardHistoryStatusResponseDTO;
import com.habitparty.adapters.in.web.dtos.response.RewardResponseDTO;
import com.habitparty.infrastructure.security.AuthenticatedUser;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

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

    @Operation(summary = "Verifica histórico da recompensa", description = "Retorna se a recompensa possui registros de transações no Histórico.")
    @GetMapping("/{rewardId}/has-history")
    ResponseEntity<RewardHistoryStatusResponseDTO> checkRewardHasHistory(
        @PathVariable UUID rewardId,
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado
    );

    @Operation(summary = "Verifica histórico do card agrupado", description = "Retorna se qualquer pacote do card possui registros de compra no Histórico.")
    @GetMapping("/group/has-history")
    ResponseEntity<RewardHistoryStatusResponseDTO> checkRewardGroupHasHistory(
        @RequestParam @NotEmpty List<UUID> ids,
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado
    );

    @Operation(summary = "Excluir Recompensa", description = "Remove uma recompensa existente. Use deleteHistory=true para remover também seus registros de compra do Histórico.")
    @DeleteMapping("/{id}")
    ResponseEntity<Void> deleteReward(
        @PathVariable UUID id,
        @RequestParam(defaultValue = "false") boolean deleteHistory,
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado
    );

    @Operation(summary = "Excluir Card Agrupado", description = "Remove todos os pacotes de um card agrupado de forma atômica.")
    @DeleteMapping("/group")
    ResponseEntity<Void> deleteRewardGroup(
        @RequestParam @NotEmpty List<UUID> ids,
        @RequestParam(defaultValue = "false") boolean deleteHistory,
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado
    );

    @Operation(summary = "Reordenar Recompensas", description = "Atualiza a ordem de exibição das recompensas.")
    @PutMapping("/reorder")
    ResponseEntity<Void> updateOrderIndex(
        @RequestBody @Size(max = 500, message = "Máximo de 500 itens por reordenação.") List<@Valid UpdateRewardOrderDTO> newOrderList,
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado
    );

    @Operation(summary = "Atualizar Card Agrupado", description = "Atualiza identidade compartilhada e sincroniza pacotes de um card agrupado de forma atômica.")
    @PutMapping("/group")
    ResponseEntity<List<RewardResponseDTO>> updateGroup(
        @RequestBody @Valid UpdateRewardGroupDTO dto,
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
