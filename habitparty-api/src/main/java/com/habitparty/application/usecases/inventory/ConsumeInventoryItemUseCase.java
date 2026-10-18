package com.habitparty.application.usecases.inventory;

import java.math.BigDecimal;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.InventoryItemRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.core.domain.entities.InventoryItem;
import com.habitparty.core.domain.entities.TransactionHistory;
import com.habitparty.core.domain.enums.TransactionType;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class ConsumeInventoryItemUseCase {
  private final InventoryItemRepository port;
  private final TransactionHistoryRepository transactionHistoryRepositoryPort;

  public ConsumeInventoryItemUseCase(InventoryItemRepository port,
      TransactionHistoryRepository transactionHistoryRepositoryPort) {
    this.port = port;
    this.transactionHistoryRepositoryPort = transactionHistoryRepositoryPort;
  }

  @Transactional
  public void execute(UUID itemId, UUID userIdLogado) {
    InventoryItem item = port.findById(itemId)
        .orElseThrow(() -> new ResourceNotFoundException("Item não encontrado"));
    item.validateOwnership(userIdLogado);
    
    // Funciona tanto para SINGLE_USE (botão Usar da mochila) 
    // quanto para TIME_BASED (botão Concluir da tela de Foco)
    item.consume();

    port.save(item);

    TransactionHistory transaction = new TransactionHistory(
        null, 
        userIdLogado, 
        item.getId(), // referenceId = ID do item consumido
        BigDecimal.ZERO, // Uso do item não gasta ouro (já foi gasto na compra)
        0, // Uso do item não dá XP
        item.getPriceSnapshot(), 
        TransactionType.ITEM_CONSUMED, 
        item.getNameSnapshot(), 
        item.getIconSnapshot().orElse(null),
        item.getPackageLevelSnapshot().orElse(null),
        null, 
        null, 
        null
    );

    transactionHistoryRepositoryPort.save(transaction);
  }
}
