package com.habitparty.application.usecases.transaction_history;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

import com.habitparty.adapters.in.web.dtos.response.TransactionHistoryResponseDTO;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.core.domain.entities.TransactionHistory;
import com.habitparty.core.domain.enums.TransactionType;

@Service
public class ListUserTransactionsUseCase {
    private final TransactionHistoryRepository port;

    public ListUserTransactionsUseCase(TransactionHistoryRepository port) {
        this.port = port;
    }

    public Page<TransactionHistoryResponseDTO> execute(UUID userId, String tab, int page, int requestedSize) {
        // Trava de segurança: Pega o que o front pediu, mas limita a no máximo 16
        int safeSize = Math.min(requestedSize, 16);

        Page<TransactionHistory> domainPage;

        if (tab == null || tab.trim().isEmpty() || tab.equalsIgnoreCase("ALL")) {
            // Se não tem aba ou é ALL, busca todas as transações paginadas
            domainPage = port.findAllByUserId(userId, page, safeSize);
        } else {
            // 1. Descobre quais tipos pertencem a esta aba
            List<TransactionType> typesToFilter = getTypesForTab(tab);
            
            // 2. Busca no banco de dados JÁ FILTRADO e PAGINADO
            domainPage = port.findAllByUserIdAndTypes(userId, typesToFilter, page, safeSize);
        }
        
        // 3. Converte a página de domínio para DTO (o Spring Page mantém os metadados de paginação)
        return domainPage.map(TransactionHistoryResponseDTO::fromDomain);
    }

    // Lógica interna para mapear as abas do Front-end para os Enums
    private List<TransactionType> getTypesForTab(String tab) {
        return switch (tab.toUpperCase()) {
            case "SHOPPING" -> List.of(
                TransactionType.REWARD_BOUGHT
            );
            case "BACKPACK" -> List.of(
                TransactionType.ITEM_CONSUMED, 
                TransactionType.ITEM_DISCARDED
            );
            case "TASKS" -> List.of(
                TransactionType.TASK_COMPLETED, 
                TransactionType.TASK_FAILED,
                TransactionType.BAD_HABIT_PENALTY 
            );
            default -> List.of(TransactionType.values()); // Fallback caso mandem uma aba inválida
        };
    }
}