package com.habitparty.adapters.in.web.api;

import java.io.IOException;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.habitparty.adapters.in.web.dtos.response.TransactionHistoryResponseDTO;
import com.habitparty.infrastructure.security.AuthenticatedUser;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;

@RequestMapping("/transactions")
@Tag(name = "Transactions", description = "Endpoints para consulta e exportação de extrato de transações de moedas/XP")
public interface TransactionHistoryApi {

    @Operation(summary = "Consultar Extrato de Transações", description = "Retorna histórico paginado de transações do usuário.")
    @GetMapping
    ResponseEntity<Page<TransactionHistoryResponseDTO>> getMyHistory(
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado,
        @RequestParam(required = false) String tab,
        @RequestParam(required = false) String period,
        @RequestParam(required = false) String search,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "8") int size
    );

    @Operation(summary = "Exportar Extrato CSV", description = "Exporta o histórico de transações em formato de arquivo CSV.")
    @GetMapping("/export")
    void exportToCsv(
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado,
        HttpServletResponse response
    ) throws IOException;

    @Operation(summary = "Excluir Registro de Transação", description = "Exclui um registro do extrato de transações.")
    @DeleteMapping("/{id}")
    ResponseEntity<Void> deleteTransaction(
        @PathVariable UUID id,
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado
    );
}
