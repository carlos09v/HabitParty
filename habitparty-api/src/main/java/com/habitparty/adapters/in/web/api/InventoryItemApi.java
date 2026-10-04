package com.habitparty.adapters.in.web.api;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.habitparty.adapters.in.web.dtos.request.UpdateInventoryOrderDTO;
import com.habitparty.adapters.in.web.dtos.response.InventoryItemResponseDTO;
import com.habitparty.infrastructure.security.AuthenticatedUser;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RequestMapping("/inventory")
@Tag(name = "Inventory", description = "Endpoints para gerenciamento do inventário e mochila do usuário")
public interface InventoryItemApi {

    @Operation(summary = "Listar Itens do Inventário", description = "Retorna os itens do inventário com filtro opcional por status.")
    @GetMapping
    ResponseEntity<List<InventoryItemResponseDTO>> getMyInventory(
        @RequestParam(required = false) String status,
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado
    );

    @Operation(summary = "Reordenar Inventário", description = "Atualiza a ordem de exibição dos itens no inventário.")
    @PutMapping("/reorder")
    ResponseEntity<Void> reorderInventory(
        @RequestBody @Valid List<UpdateInventoryOrderDTO> orderList,
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado
    );

    @Operation(summary = "Consumir Item", description = "Consome um item do inventário.")
    @PostMapping("/{itemId}/consume")
    ResponseEntity<Void> consumeItem(
        @PathVariable UUID itemId,
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado
    );

    @Operation(summary = "Descartar Item", description = "Descarta um item do inventário permanentemente.")
    @DeleteMapping("/{itemId}/discard")
    ResponseEntity<Void> discardItem(
        @PathVariable UUID itemId,
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado
    );

    @Operation(summary = "Enviar Item para Foco", description = "Move um item da mochila para o painel de foco ativo.")
    @PatchMapping("/{itemId}/send-to-focus")
    ResponseEntity<Void> sendToFocus(
        @PathVariable UUID itemId,
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado
    );

    @Operation(summary = "Retornar Item para Mochila", description = "Retorna um item de foco de volta para a mochila.")
    @PatchMapping("/{itemId}/return-to-backpack")
    ResponseEntity<Void> returnToBackpack(
        @PathVariable UUID itemId,
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado
    );
}
