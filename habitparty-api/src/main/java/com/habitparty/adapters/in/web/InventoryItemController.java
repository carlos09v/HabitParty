package com.habitparty.adapters.in.web;

import com.habitparty.adapters.in.web.dtos.request.UpdateInventoryOrderDTO;
import com.habitparty.adapters.in.web.dtos.response.InventoryItemResponseDTO;
import com.habitparty.adapters.out.persistence.entities.UserJpaEntity;
import com.habitparty.application.usecases.inventory_Item.ConsumeInventoryItemUseCase;
import com.habitparty.application.usecases.inventory_Item.DiscardInventoryItemUseCase;
import com.habitparty.application.usecases.inventory_Item.ListUserInventoryUseCase;
import com.habitparty.application.usecases.inventory_Item.ReorderInventoryItemUseCase;
import com.habitparty.application.usecases.inventory_Item.ReturnItemToBagUseCase;
import com.habitparty.application.usecases.inventory_Item.SendItemToFocusUseCase;
import com.habitparty.core.domain.entities.InventoryItem;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/inventory")
public class InventoryItemController {
    private final ListUserInventoryUseCase listUseCase;
    private final ReorderInventoryItemUseCase reorderUseCase;
    private final ConsumeInventoryItemUseCase consumeUseCase;
    private final DiscardInventoryItemUseCase discardUseCase;
    private final SendItemToFocusUseCase sendItemFocusUseCase;
    private final ReturnItemToBagUseCase returnItemBagUseCase;

    public InventoryItemController(
            ListUserInventoryUseCase listUseCase,
            ReorderInventoryItemUseCase reorderUseCase,
            ConsumeInventoryItemUseCase consumeUseCase,
            DiscardInventoryItemUseCase discardUseCase,SendItemToFocusUseCase sendItemFocusUseCase, ReturnItemToBagUseCase returnItemBagUseCase) {
        this.listUseCase = listUseCase;
        this.reorderUseCase = reorderUseCase;
        this.consumeUseCase = consumeUseCase;
        this.discardUseCase = discardUseCase;
        this.sendItemFocusUseCase = sendItemFocusUseCase;
        this.returnItemBagUseCase = returnItemBagUseCase;
    }

    @GetMapping
    public ResponseEntity<List<InventoryItemResponseDTO>> getMyInventory(
            @RequestParam(required = false) String status, // Pega o parâmetro da URL
            @AuthenticationPrincipal UserJpaEntity usuarioLogado) {
        
        UUID userId = usuarioLogado.getId();

        // Passa o status opcional para o UseCase
        List<InventoryItem> domainList = listUseCase.execute(userId, status);
        
        List<InventoryItemResponseDTO> response = domainList.stream()
                .map(InventoryItemResponseDTO::fromDomain)
                .toList();

        return ResponseEntity.ok(response);
    }

    @PutMapping("/reorder")
    public ResponseEntity<Void> reorderInventory(
            @RequestBody @Valid List<UpdateInventoryOrderDTO> orderList,
            @AuthenticationPrincipal UserJpaEntity usuarioLogado) {
        UUID userId = usuarioLogado.getId();

        reorderUseCase.execute(orderList, userId);

        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{itemId}/consume")
    public ResponseEntity<Void> consumeItem(
            @PathVariable UUID itemId,
            @AuthenticationPrincipal UserJpaEntity usuarioLogado) {
        UUID userId = usuarioLogado.getId();

        consumeUseCase.execute(itemId, userId);

        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{itemId}/discard")
    public ResponseEntity<Void> discardItem(
            @PathVariable UUID itemId,
            @AuthenticationPrincipal UserJpaEntity usuarioLogado) {
        UUID userId = usuarioLogado.getId();

        discardUseCase.execute(itemId, userId);

        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{itemId}/send-to-focus")
    public ResponseEntity<Void> sendToFocus(
            @PathVariable UUID itemId,
            @AuthenticationPrincipal UserJpaEntity usuarioLogado) {
        sendItemFocusUseCase.execute(itemId, usuarioLogado.getId());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{itemId}/return-to-backpack")
    public ResponseEntity<Void> returnToBackpack(
            @PathVariable UUID itemId,
            @AuthenticationPrincipal UserJpaEntity usuarioLogado) {
        returnItemBagUseCase.execute(itemId, usuarioLogado.getId());
        return ResponseEntity.noContent().build();
    }
}