package com.habitparty.adapters.in.web;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.io.Writer;
import java.time.LocalDate;
import java.util.Locale;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import com.habitparty.adapters.in.web.api.TransactionHistoryApi;
import com.habitparty.adapters.in.web.dtos.request.DeleteTransactionsBatchDTO;
import com.habitparty.adapters.in.web.dtos.request.RestoreTransactionsBatchDTO;
import com.habitparty.adapters.in.web.dtos.response.TransactionBatchResultDTO;
import com.habitparty.adapters.in.web.dtos.response.TransactionHistoryPageResponseDTO;
import com.habitparty.application.usecases.transaction.DeleteTransactionHistoryUseCase;
import com.habitparty.application.usecases.transaction.ExportTransactionsCsvUseCase;
import com.habitparty.application.usecases.transaction.ListUserTransactionsUseCase;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@RestController
public class TransactionHistoryController implements TransactionHistoryApi {
    private static final Logger log = LoggerFactory.getLogger(TransactionHistoryController.class);

    private final ListUserTransactionsUseCase listUseCase;
    private final DeleteTransactionHistoryUseCase deleteTransactionHistoryUseCase;
    private final ExportTransactionsCsvUseCase exportTransactionsCsvUseCase;

    @Override
    public ResponseEntity<TransactionHistoryPageResponseDTO> getMyHistory(
            UUID userId,
            String tab,
            String period,
            LocalDate from,
            LocalDate to,
            String search,
            String direction,
            String sort,
            int page,
            int size) {

        var result = listUseCase.executeWithSummary(userId, tab, period, from, to, search, direction, sort, page, size);
        return ResponseEntity.ok(
                TransactionHistoryPageResponseDTO.fromDomain(result.page(), result.summary(), result.userZone()));
    }

    @Override
    public void exportToCsv(
            UUID userId,
            String tab,
            String period,
            LocalDate from,
            LocalDate to,
            String search,
            String direction,
            String sort,
            String dateFormat,
            String timeFormat,
            String acceptLanguage,
            HttpServletResponse response) throws IOException {

        Locale locale = resolveLocale(acceptLanguage);
        boolean isEnglish = locale.getLanguage().toLowerCase(Locale.ROOT).startsWith("en");
        String filename = isEnglish ? "my_statement.csv" : "meu_extrato.csv";

        LazyServletWriter lazyWriter = new LazyServletWriter(response);
        try {
            exportTransactionsCsvUseCase.execute(
                    userId,
                    tab,
                    period,
                    from,
                    to,
                    search,
                    direction,
                    sort,
                    locale,
                    dateFormat,
                    timeFormat,
                    lazyWriter,
                    () -> {
                        response.setContentType("text/csv");
                        response.setCharacterEncoding("UTF-8");
                        response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"");
                        response.setHeader("X-Export-Max-Rows", String.valueOf(ExportTransactionsCsvUseCase.MAX_EXPORT_ROWS));
                        try {
                            lazyWriter.write('\uFEFF');
                        } catch (IOException e) {
                            throw new UncheckedIOException(e);
                        }
                    });
        } catch (UncheckedIOException e) {
            if (response.isCommitted()) {
                log.debug("[CSV Export] Cliente desconectou durante streaming para usuário {}: {}", userId, e.getMessage());
                return;
            }
            throw e.getCause();
        } catch (RuntimeException e) {
            if (response.isCommitted() && hasIoCause(e)) {
                log.debug("[CSV Export] Streaming CSV interrompido após commit da resposta para usuário {}: {}",
                        userId, e.getMessage());
                return;
            }
            throw e;
        }
    }

    private static boolean hasIoCause(Throwable throwable) {
        Throwable cursor = throwable;
        while (cursor != null) {
            if (cursor instanceof IOException) {
                return true;
            }
            cursor = cursor.getCause();
        }
        return false;
    }

    @Override
    public ResponseEntity<Void> deleteTransaction(UUID id, UUID userId) {
        deleteTransactionHistoryUseCase.execute(id, userId);
        return ResponseEntity.noContent().build();
    }

    @Override
    public ResponseEntity<TransactionBatchResultDTO> deleteTransactionsBatch(
            DeleteTransactionsBatchDTO dto,
            UUID userId) {
        int affected = deleteTransactionHistoryUseCase.executeBatch(dto.ids(), userId);
        return ResponseEntity.ok(new TransactionBatchResultDTO(affected));
    }

    @Override
    public ResponseEntity<TransactionBatchResultDTO> restoreTransactionsBatch(
            RestoreTransactionsBatchDTO dto,
            UUID userId) {
        int restored = deleteTransactionHistoryUseCase.restoreBatch(dto.ids(), userId);
        return ResponseEntity.ok(new TransactionBatchResultDTO(restored));
    }

    private static Locale resolveLocale(String acceptLanguage) {
        if (acceptLanguage == null || acceptLanguage.isBlank()) {
            return Locale.forLanguageTag("pt-BR");
        }
        String primary = acceptLanguage.split(",")[0].split(";")[0].trim();
        if (primary.toLowerCase(Locale.ROOT).startsWith("en")) {
            return Locale.US;
        }
        return Locale.forLanguageTag("pt-BR");
    }

    private static final class LazyServletWriter extends Writer {
        private final HttpServletResponse response;
        private Writer delegate;

        LazyServletWriter(HttpServletResponse response) {
            this.response = response;
        }

        private Writer ensureWriter() throws IOException {
            if (delegate == null) {
                delegate = response.getWriter();
            }
            return delegate;
        }

        @Override
        public void write(char[] cbuf, int off, int len) throws IOException {
            ensureWriter().write(cbuf, off, len);
        }

        @Override
        public void flush() throws IOException {
            if (delegate != null) {
                delegate.flush();
            }
        }

        @Override
        public void close() throws IOException {
            if (delegate != null) {
                delegate.flush();
            }
        }
    }
}
