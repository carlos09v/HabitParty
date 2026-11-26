package com.habitparty.adapters.in.web.api;

import java.io.IOException;
import java.time.LocalDate;
import java.util.UUID;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.habitparty.adapters.in.web.dtos.request.DeleteTransactionsBatchDTO;
import com.habitparty.adapters.in.web.dtos.request.RestoreTransactionsBatchDTO;
import com.habitparty.adapters.in.web.dtos.response.TransactionBatchResultDTO;
import com.habitparty.adapters.in.web.dtos.response.TransactionHistoryPageResponseDTO;
import com.habitparty.infrastructure.security.CurrentUserId;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

@RequestMapping("/transactions")
@Tag(name = "Transactions", description = "Endpoints para consulta e exportação de extrato de transações de moedas/XP")
public interface TransactionHistoryApi {

    @Operation(summary = "Consultar Extrato de Transações", description = "Retorna histórico paginado de transações do usuário com resumo agregado do período filtrado.")
    @GetMapping
    ResponseEntity<TransactionHistoryPageResponseDTO> getMyHistory(
        @Parameter(hidden = true) @CurrentUserId UUID userId,
        @RequestParam(required = false) String tab,
        @RequestParam(required = false) String period,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) String search,
        @RequestParam(required = false) String direction,
        @RequestParam(required = false) String sort,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    );

    @Operation(summary = "Exportar Extrato CSV", description = "Exporta o histórico de transações filtrado em streaming no formato CSV.")
    @GetMapping("/export")
    void exportToCsv(
        @Parameter(hidden = true) @CurrentUserId UUID userId,
        @RequestParam(required = false) String tab,
        @RequestParam(required = false) String period,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) String search,
        @RequestParam(required = false) String direction,
        @RequestParam(required = false) String sort,
        @RequestParam(required = false) String dateFormat,
        @RequestParam(required = false) String timeFormat,
        @RequestHeader(value = "Accept-Language", required = false) String acceptLanguage,
        HttpServletResponse response
    ) throws IOException;

    @Operation(summary = "Ocultar Registro de Transação", description = "Remove logicamente um registro do extrato de transações preservando integridade operacional.")
    @DeleteMapping("/{id}")
    ResponseEntity<Void> deleteTransaction(
        @PathVariable UUID id,
        @Parameter(hidden = true) @CurrentUserId UUID userId
    );

    @Operation(summary = "Ocultar Registros em Lote", description = "Remove logicamente vários registros do extrato de transações de uma vez (máx. 200).")
    @DeleteMapping("/batch")
    ResponseEntity<TransactionBatchResultDTO> deleteTransactionsBatch(
        @RequestBody @Valid DeleteTransactionsBatchDTO dto,
        @Parameter(hidden = true) @CurrentUserId UUID userId
    );

    @Operation(summary = "Restaurar Registros em Lote", description = "Restaura registros ocultados do extrato (suporte a Desfazer / Undo).")
    @PostMapping("/restore")
    ResponseEntity<TransactionBatchResultDTO> restoreTransactionsBatch(
        @RequestBody @Valid RestoreTransactionsBatchDTO dto,
        @Parameter(hidden = true) @CurrentUserId UUID userId
    );
}
