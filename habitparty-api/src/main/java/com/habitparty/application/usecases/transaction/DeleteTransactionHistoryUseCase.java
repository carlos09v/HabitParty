package com.habitparty.application.usecases.transaction;

import java.util.List;
import java.util.Objects;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.core.domain.entities.TransactionHistory;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class DeleteTransactionHistoryUseCase {
  static final int MAX_BATCH_SIZE = 200;

  private final TransactionHistoryRepository port;

  public DeleteTransactionHistoryUseCase(TransactionHistoryRepository port) {
    this.port = port;
  }

  /**
   * Oculta logicamente um registro do extrato (preservando dados operacionais como
   * limite diário de hábitos, streak efetivo e retrospectiva anual).
   */
  @Transactional
  public void execute(UUID transactionId, UUID userIdLogado) {
    TransactionHistory transaction = port.findById(transactionId)
        .orElseThrow(() -> new ResourceNotFoundException("Registro de transação não encontrado."));
    transaction.validateOwnership(userIdLogado);

    port.hideByIdAndUserId(transactionId, userIdLogado);
  }

  /**
   * Ocultação lógica em lote: oculta apenas registros pertencentes ao usuário logado
   * (IDs de outros usuários são ignorados silenciosamente pela cláusula de ownership).
   */
  @Transactional
  public int executeBatch(List<UUID> transactionIds, UUID userIdLogado) {
    List<UUID> distinctIds = validateAndDeduplicate(transactionIds, "exclusão");
    return port.hideAllByIdsAndUserId(distinctIds, userIdLogado);
  }

  /**
   * Restaura registros ocultados do extrato (suporte a Desfazer / Undo na interface).
   */
  @Transactional
  public int restoreBatch(List<UUID> transactionIds, UUID userIdLogado) {
    List<UUID> distinctIds = validateAndDeduplicate(transactionIds, "restauração");
    return port.restoreAllByIdsAndUserId(distinctIds, userIdLogado);
  }

  private List<UUID> validateAndDeduplicate(List<UUID> transactionIds, String actionLabel) {
    if (transactionIds == null || transactionIds.isEmpty()) {
      throw new DomainValidationException("Nenhum registro selecionado para " + actionLabel + ".");
    }
    if (transactionIds.size() > MAX_BATCH_SIZE) {
      throw new DomainValidationException("Limite de " + MAX_BATCH_SIZE + " registros por " + actionLabel + " em lote.");
    }
    List<UUID> distinctIds = transactionIds.stream().filter(Objects::nonNull).distinct().toList();
    if (distinctIds.isEmpty()) {
      throw new DomainValidationException("Nenhum registro válido selecionado para " + actionLabel + ".");
    }
    return distinctIds;
  }
}
