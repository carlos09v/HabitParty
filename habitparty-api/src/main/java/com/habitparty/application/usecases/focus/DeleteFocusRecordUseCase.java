package com.habitparty.application.usecases.focus;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.FocusRecordRepository;
import com.habitparty.application.ports.InventoryItemRepository;
import com.habitparty.core.domain.entities.focus.FocusRecord;
import com.habitparty.core.exceptions.ResourceNotFoundException;


@Service
public class DeleteFocusRecordUseCase {
    private final FocusRecordRepository port;
    private final InventoryItemRepository inventoryItemPort;

    public DeleteFocusRecordUseCase(FocusRecordRepository port, InventoryItemRepository inventoryItemPort) {
        this.port = port;
        this.inventoryItemPort = inventoryItemPort;
    }

    @Transactional
    public void execute(UUID userIdLogado, UUID recordId) {
        FocusRecord record = port.findById(recordId)
            .orElseThrow(() -> new ResourceNotFoundException("Registro não encontrado."));
        record.validateOwnership(userIdLogado);

        // Se esse tempo foi gasto de um cupom, devolvemos o saldo!
        if (record.getInventoryItemId().isPresent()) {
            UUID itemId = record.getInventoryItemId().get();
            inventoryItemPort.findById(itemId).ifPresent(item -> {
                // Reembolsa o tempo e reverte o status se necessário
                item.refundTime(record.getDurationMinutes()); 
                inventoryItemPort.save(item);
            });
        }

        port.deleteById(recordId);
    }
}