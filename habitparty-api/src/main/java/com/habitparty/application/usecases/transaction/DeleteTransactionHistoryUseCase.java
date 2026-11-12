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

    @Transactional
    public void execute(UUID transactionId, UUID userIdLogado) {
        TransactionHistory transaction = port.findById(transactionId)
            .orElseThrow(() -> new ResourceNotFoundException("Registro de transação não encontrado."));
        transaction.validateOwnership(userIdLogado);

        // 3. Deleta do banco
        port.deleteById(transactionId);
    }

    /**
     * Exclusão em lote: remove apenas os registros que pertencem ao usuário logado
     * (IDs de outros usuários são ignorados silenciosamente pela cláusula de ownership).
     */
    @Transactional
    public int executeBatch(List<UUID> transactionIds, UUID userIdLogado) {
        if (transactionIds == null || transactionIds.isEmpty()) {
            throw new DomainValidationException("Nenhum registro selecionado para exclusão.");
        }
        if (transactionIds.size() > MAX_BATCH_SIZE) {
            throw new DomainValidationException("Limite de " + MAX_BATCH_SIZE + " registros por exclusão em lote.");
        }
        List<UUID> distinctIds = transactionIds.stream().filter(Objects::nonNull).distinct().toList();
        return port.deleteAllByIdsAndUserId(distinctIds, userIdLogado);
    }
}
