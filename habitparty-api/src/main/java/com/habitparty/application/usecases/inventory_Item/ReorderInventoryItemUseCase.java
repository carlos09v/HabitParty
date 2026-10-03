package com.habitparty.application.usecases.inventory_Item;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.adapters.in.web.dtos.request.UpdateInventoryOrderDTO;
import com.habitparty.application.ports.InventoryItemRepository;
import com.habitparty.core.domain.entities.InventoryItem;
import com.habitparty.core.domain.enums.InventoryItemStatus;

@Service
public class ReorderInventoryItemUseCase {
    private final InventoryItemRepository port;

    public ReorderInventoryItemUseCase(InventoryItemRepository port) {
        this.port = port;
    }

    @Transactional
    public void execute(List<UpdateInventoryOrderDTO> newOrderList, UUID userId) {
        // 1. Busca os itens da mochila (tanto os disponíveis quanto os que estão em uso no foco)
        List<InventoryItemStatus> statusesToReorder = List.of(
            InventoryItemStatus.AVAILABLE, 
            InventoryItemStatus.IN_FOCUS
        );

        List<InventoryItem> items = port.findByUserIdAndStatusIn(userId, statusesToReorder);

        // 2. Atualiza o orderIndex de cada item cruzando com o DTO recebido
        for (InventoryItem item : items) {
            newOrderList.stream()
                .filter(dto -> dto.itemId().equals(item.getId()))
                .findFirst()
                .ifPresent(dto -> item.setOrderIndex(dto.newIndex()));
        }

        // 3. Salva a lista atualizada no banco em lote
        port.saveAll(items);
    }
}
