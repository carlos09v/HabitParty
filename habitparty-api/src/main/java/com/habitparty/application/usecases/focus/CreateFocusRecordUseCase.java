package com.habitparty.application.usecases.focus;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.adapters.in.web.dtos.request.CreateFocusRecordDTO;
import com.habitparty.adapters.in.web.dtos.response.FocusRecordResponseDTO;
import com.habitparty.application.ports.FocusRecordRepository;
import com.habitparty.application.ports.InventoryItemRepository;
import com.habitparty.core.domain.entities.InventoryItem;
import com.habitparty.core.domain.entities.focus.FocusRecord;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class CreateFocusRecordUseCase {
  private final FocusRecordRepository port;
  private final InventoryItemRepository inventoryItemPort;
  // Futuramente: private final TransactionPort transactionPort;

  public CreateFocusRecordUseCase(FocusRecordRepository port, InventoryItemRepository inventoryItemPort) {
    this.port = port;
    this.inventoryItemPort = inventoryItemPort;
  }

  @Transactional
  public FocusRecordResponseDTO execute(UUID userIdLogado, CreateFocusRecordDTO dto) {
    FocusRecord record = new FocusRecord(
        null,
        userIdLogado,
        dto.focusActivityId(),
        dto.inventoryItemId(),
        dto.notes(),
        dto.startTime(),
        dto.endTime(),
        dto.recordType(),
        dto.completedPomos());

    // 2. Se for o uso de uma recompensa, aplica a lógica de inventário
    if (record.getInventoryItemId().isPresent()) {
      UUID itemId = record.getInventoryItemId().get();

      InventoryItem item = inventoryItemPort.findById(itemId)
          .orElseThrow(() -> new ResourceNotFoundException("Item de inventário não encontrado."));
      item.validateOwnership(userIdLogado);

      // O Domínio do InventoryItem deduz o tempo e não deixa ficar negativo
      item.deductTime(record.getDurationMinutes());

      inventoryItemPort.save(item);
    }

    FocusRecord savedRecord = port.save(record);

    return FocusRecordResponseDTO.fromDomain(savedRecord);
  }
}