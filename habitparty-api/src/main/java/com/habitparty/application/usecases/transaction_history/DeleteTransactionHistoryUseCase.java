package com.habitparty.application.usecases.transaction_history;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.core.domain.entities.TransactionHistory;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class DeleteTransactionHistoryUseCase {
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
}
