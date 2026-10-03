package com.habitparty.adapters.in.web;

import java.io.IOException;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.habitparty.adapters.in.web.dtos.response.TransactionHistoryResponseDTO;
import com.habitparty.adapters.out.persistence.entities.UserJpaEntity;
import com.habitparty.application.usecases.transaction_history.DeleteTransactionHistoryUseCase;
import com.habitparty.application.usecases.transaction_history.ExportTransactionsCsvUseCase;
import com.habitparty.application.usecases.transaction_history.ListUserTransactionsUseCase;

import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.HttpHeaders;

@RestController
@RequestMapping("/transactions")
public class TransactionHistoryController {
    private final ListUserTransactionsUseCase listUseCase;
    private final DeleteTransactionHistoryUseCase deleteTransactionHistoryUseCase;
    private final ExportTransactionsCsvUseCase exportTransactionsCsvUseCase;

    public TransactionHistoryController(ListUserTransactionsUseCase listUseCase, DeleteTransactionHistoryUseCase deleteTransactionHistoryUseCase, ExportTransactionsCsvUseCase exportTransactionsCsvUseCase) {
        this.listUseCase = listUseCase;
        this.deleteTransactionHistoryUseCase = deleteTransactionHistoryUseCase;
        this.exportTransactionsCsvUseCase = exportTransactionsCsvUseCase;
    }

    @GetMapping
    public ResponseEntity<Page<TransactionHistoryResponseDTO>> getMyHistory(
            @AuthenticationPrincipal UserJpaEntity usuarioLogado,
            @RequestParam(required = false) String tab, // Ex: ?tab=SHOPPING
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "8") int size) { // Começa na página 0

        UUID userId = usuarioLogado.getId();
        Page<TransactionHistoryResponseDTO> response = listUseCase.execute(userId, tab, page, size);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/export")
    public void exportToCsv(
            @AuthenticationPrincipal UserJpaEntity usuarioLogado,
            HttpServletResponse response) throws IOException {

        // 1. Configura a resposta como um arquivo CSV com codificação UTF-8
        response.setContentType("text/csv");
        response.setCharacterEncoding("UTF-8");
        
        // 2. Avisa ao navegador para fazer o download (attachment) com este nome de arquivo
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"meu_extrato.csv\"");

        // 3. Escreve o BOM (Byte Order Mark) para o Excel ler os acentos brasileiros perfeitamente
        response.getWriter().write('\uFEFF');

        // 4. Passa o canal de escrita para o UseCase mandar os dados em tempo real
        exportTransactionsCsvUseCase.execute(usuarioLogado.getId(), response.getWriter());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransaction(
      @PathVariable UUID id,
      @AuthenticationPrincipal UserJpaEntity usuarioLogado
    ) {
      UUID userId = usuarioLogado.getId();
      deleteTransactionHistoryUseCase.execute(id, userId);

      return ResponseEntity.noContent().build();
    }
}
