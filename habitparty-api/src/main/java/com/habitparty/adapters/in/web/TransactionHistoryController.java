package com.habitparty.adapters.in.web;

import java.io.IOException;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import com.habitparty.adapters.in.web.api.TransactionHistoryApi;
import com.habitparty.adapters.in.web.dtos.response.TransactionHistoryResponseDTO;
import com.habitparty.application.usecases.transaction_history.DeleteTransactionHistoryUseCase;
import com.habitparty.application.usecases.transaction_history.ExportTransactionsCsvUseCase;
import com.habitparty.application.usecases.transaction_history.ListUserTransactionsUseCase;
import com.habitparty.infrastructure.security.AuthenticatedUser;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@RestController
public class TransactionHistoryController implements TransactionHistoryApi {
    private final ListUserTransactionsUseCase listUseCase;
    private final DeleteTransactionHistoryUseCase deleteTransactionHistoryUseCase;
    private final ExportTransactionsCsvUseCase exportTransactionsCsvUseCase;

    @Override
    public ResponseEntity<Page<TransactionHistoryResponseDTO>> getMyHistory(
            AuthenticatedUser usuarioLogado,
            String tab,
            int page,
            int size) {

        UUID userId = usuarioLogado.id();
        Page<TransactionHistoryResponseDTO> response = listUseCase.execute(userId, tab, page, size);
        return ResponseEntity.ok(response);
    }

    @Override
    public void exportToCsv(
            AuthenticatedUser usuarioLogado,
            HttpServletResponse response) throws IOException {

        response.setContentType("text/csv");
        response.setCharacterEncoding("UTF-8");
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"meu_extrato.csv\"");
        response.getWriter().write('\uFEFF');

        exportTransactionsCsvUseCase.execute(usuarioLogado.id(), response.getWriter());
    }

    @Override
    public ResponseEntity<Void> deleteTransaction(
            UUID id,
            AuthenticatedUser usuarioLogado) {
        UUID userId = usuarioLogado.id();
        deleteTransactionHistoryUseCase.execute(id, userId);

        return ResponseEntity.noContent().build();
    }
}
