package com.habitparty.adapters.in.web;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import com.habitparty.adapters.in.web.api.InventoryItemApi;
import com.habitparty.adapters.in.web.dtos.request.UpdateInventoryOrderDTO;
import com.habitparty.adapters.in.web.dtos.response.InventoryItemResponseDTO;
import com.habitparty.application.usecases.inventory_Item.ConsumeInventoryItemUseCase;
import com.habitparty.application.usecases.inventory_Item.DiscardInventoryItemUseCase;
import com.habitparty.application.usecases.inventory_Item.ListUserInventoryUseCase;
import com.habitparty.application.usecases.inventory_Item.ReorderInventoryItemUseCase;
import com.habitparty.application.usecases.inventory_Item.ReturnItemToBagUseCase;
import com.habitparty.application.usecases.inventory_Item.SendItemToFocusUseCase;
import com.habitparty.core.domain.entities.InventoryItem;
import com.habitparty.infrastructure.security.AuthenticatedUser;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@RestController
public class InventoryItemController implements InventoryItemApi {
    private final ListUserInventoryUseCase listUseCase;
    private final ReorderInventoryItemUseCase reorderUseCase;
    private final ConsumeInventoryItemUseCase consumeUseCase;
    private final DiscardInventoryItemUseCase discardUseCase;
    private final SendItemToFocusUseCase sendItemFocusUseCase;
    private final ReturnItemToBagUseCase returnItemBagUseCase;

    @Override
    public ResponseEntity<List<InventoryItemResponseDTO>> getMyInventory(
            String status,
            AuthenticatedUser usuarioLogado) {
        UUID userId = usuarioLogado.id();
        List<InventoryItem> domainList = listUseCase.execute(userId, status);
        
        List<InventoryItemResponseDTO> response = domainList.stream()
                .map(InventoryItemResponseDTO::fromDomain)
                .toList();

        return ResponseEntity.ok(response);
    }

    @Override
    public ResponseEntity<Void> reorderInventory(
            List<UpdateInventoryOrderDTO> orderList,
            AuthenticatedUser usuarioLogado) {
        UUID userId = usuarioLogado.id();
        reorderUseCase.execute(orderList, userId);

        return ResponseEntity.noContent().build();
    }

    @Override
    public ResponseEntity<Void> consumeItem(
            UUID itemId,
            AuthenticatedUser usuarioLogado) {
        UUID userId = usuarioLogado.id();
        consumeUseCase.execute(itemId, userId);

        return ResponseEntity.noContent().build();
    }

    @Override
    public ResponseEntity<Void> discardItem(
            UUID itemId,
            AuthenticatedUser usuarioLogado) {
        UUID userId = usuarioLogado.id();
        discardUseCase.execute(itemId, userId);

        return ResponseEntity.noContent().build();
    }

    @Override
    public ResponseEntity<Void> sendToFocus(
            UUID itemId,
            AuthenticatedUser usuarioLogado) {
        sendItemFocusUseCase.execute(itemId, usuarioLogado.id());
        return ResponseEntity.noContent().build();
    }

    @Override
    public ResponseEntity<Void> returnToBackpack(
            UUID itemId,
            AuthenticatedUser usuarioLogado) {
        returnItemBagUseCase.execute(itemId, usuarioLogado.id());
        return ResponseEntity.noContent().build();
    }
}