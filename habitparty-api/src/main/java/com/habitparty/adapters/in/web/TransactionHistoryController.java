package com.habitparty.adapters.in.web;

import java.io.IOException;
import java.time.ZoneId;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import com.habitparty.adapters.in.web.api.TransactionHistoryApi;
import com.habitparty.adapters.in.web.dtos.request.DeleteTransactionsBatchDTO;
import com.habitparty.adapters.in.web.dtos.response.TransactionHistoryResponseDTO;
import com.habitparty.application.usecases.transaction.DeleteTransactionHistoryUseCase;
import com.habitparty.application.usecases.transaction.ExportTransactionsCsvUseCase;
import com.habitparty.application.usecases.transaction.ListUserTransactionsUseCase;
import com.habitparty.application.usecases.user.UserTimeResolver;
import com.habitparty.infrastructure.security.AuthenticatedUser;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@RestController
public class TransactionHistoryController implements TransactionHistoryApi {
    private final ListUserTransactionsUseCase listUseCase;
    private final DeleteTransactionHistoryUseCase deleteTransactionHistoryUseCase;
    private final ExportTransactionsCsvUseCase exportTransactionsCsvUseCase;
    private final UserTimeResolver userTimeResolver;

    @Override
    public ResponseEntity<Page<TransactionHistoryResponseDTO>> getMyHistory(
            AuthenticatedUser usuarioLogado,
            String tab,
            String period,
            String search,
            int page,
            int size) {

        UUID userId = usuarioLogado.id();
        ZoneId userZone = userTimeResolver.resolveZone(userId);
        Page<TransactionHistoryResponseDTO> response = listUseCase.execute(userId, tab, period, search, page, size)
                .map(tx -> TransactionHistoryResponseDTO.fromDomain(tx, userZone));
        return ResponseEntity.ok(response);
    }

    @Override
    public void exportToCsv(
            AuthenticatedUser usuarioLogado,
            String tab,
            String period,
            String search,
            HttpServletResponse response) throws IOException {

        response.setContentType("text/csv");
        response.setCharacterEncoding("UTF-8");
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"meu_extrato.csv\"");
        response.getWriter().write('\uFEFF');

        exportTransactionsCsvUseCase.execute(usuarioLogado.id(), tab, period, search, response.getWriter());
    }

    @Override
    public ResponseEntity<Void> deleteTransaction(
            UUID id,
            AuthenticatedUser usuarioLogado) {
        UUID userId = usuarioLogado.id();
        deleteTransactionHistoryUseCase.execute(id, userId);

        return ResponseEntity.noContent().build();
    }

    @Override
    public ResponseEntity<Void> deleteTransactionsBatch(
            DeleteTransactionsBatchDTO dto,
            AuthenticatedUser usuarioLogado) {
        deleteTransactionHistoryUseCase.executeBatch(dto.ids(), usuarioLogado.id());

        return ResponseEntity.noContent().build();
    }
}
