package com.habitparty.application.usecases.inventory_Item;

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
public class DiscardInventoryItemUseCase {
  private final InventoryItemRepository port;
  private final TransactionHistoryRepository transactionHistoryRepositoryPort;

  public DiscardInventoryItemUseCase(InventoryItemRepository port,
      TransactionHistoryRepository transactionHistoryRepositoryPort) {
    this.port = port;
    this.transactionHistoryRepositoryPort = transactionHistoryRepositoryPort;
  }

  @Transactional
  public void execute(UUID itemId, UUID userIdLogado) {
    InventoryItem item = port.findById(itemId)
        .orElseThrow(() -> new ResourceNotFoundException("Item não encontrado"));
    item.validateOwnership(userIdLogado);

    item.discard(); // Muda o status para DISCARDED no domínio

    port.save(item);

    TransactionHistory transaction = new TransactionHistory(
        null, // Pode deixar null que o Domínio gera o UUID
        userIdLogado, 
        item.getId(), // O referenceId passa a ser o ID do item
        BigDecimal.ZERO, // Nenhuma movimentação de Ouro
        0, // Nenhuma movimentação de XP
        item.getPriceSnapshot(), 
        TransactionType.ITEM_DISCARDED, 
        item.getNameSnapshot(), 
        item.getIconSnapshot().orElse(null),
        item.getPackageLevelSnapshot().orElse(null),
        null, // difficulty (Não se aplica a item)
        null, // tags (Não se aplica a item)
        null  // Pode deixar null que o Domínio pega o LocalDateTime.now()
    );

    transactionHistoryRepositoryPort.save(transaction);
  }
}
