package com.habitparty.application.usecases.inventory;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.habitparty.application.ports.InventoryItemRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.InventoryItem;
import com.habitparty.core.domain.enums.InventoryItemStatus;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class ListUserInventoryUseCase {
  private final InventoryItemRepository port;
  private final UserRepository userPort;

  public ListUserInventoryUseCase(InventoryItemRepository port,
      UserRepository userPort) {
    this.port = port;
    this.userPort = userPort;
  }

  public List<InventoryItem> execute(UUID userId, String statusStr) {
    // Verificar se o user existe.
    userPort.findById(userId) // <-- Usa o ID confiável do Backend!
        .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado!"));

    List<InventoryItemStatus> statusToSearch;
    // 1. Se o Front-end não mandar nada (?status=), o padrão é a mochila: 
    // Mostra tanto os itens disponíveis quanto os que estão em uso no momento.
    if (statusStr == null || statusStr.trim().isEmpty()) {
      statusToSearch = List.of(InventoryItemStatus.AVAILABLE, InventoryItemStatus.IN_FOCUS);
    } else {
      // 2. Se mandar (ex: ?status=IN_FOCUS para a tela de timer), carrega só aquele específico
      try {
        statusToSearch = List.of(InventoryItemStatus.valueOf(statusStr.toUpperCase()));
      } catch (IllegalArgumentException e) {
        throw new DomainValidationException("Status de inventário inválido: " + statusStr);
      }
    }

    return port.findByUserIdAndStatusIn(userId, statusToSearch);
  }
}