package com.habitparty.application.usecases.transaction;

import java.io.Writer;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.TransactionCsvExporterPort;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.core.domain.enums.TransactionType;

@Service
@Transactional(readOnly = true)
public class ExportTransactionsCsvUseCase {
  private static final int BATCH_SIZE = 500;

  private final TransactionHistoryRepository transactionHistoryRepository;
  private final TransactionCsvExporterPort exporterPort;

  public ExportTransactionsCsvUseCase(
      TransactionHistoryRepository transactionHistoryRepository,
      TransactionCsvExporterPort exporterPort) {
    this.transactionHistoryRepository = transactionHistoryRepository;
    this.exporterPort = exporterPort;
  }

  public void execute(UUID userId, Writer writer) {
    execute(userId, null, null, null, writer);
  }

  public void execute(UUID userId, String tab, String period, String search, Writer writer) {
    List<TransactionType> typesToFilter = ListUserTransactionsUseCase.resolveTypesForTab(tab);
    LocalDateTime startDate = ListUserTransactionsUseCase.resolveStartDateForPeriod(period);
    String safeSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;

    if (typesToFilter == null && startDate == null && safeSearch == null) {
      exporterPort.exportTransactions(
          page -> transactionHistoryRepository.findAllByUserId(userId, page, BATCH_SIZE),
          writer
      );
      return;
    }

    exporterPort.exportTransactions(
        page -> transactionHistoryRepository.findFiltered(userId, typesToFilter, startDate, safeSearch, page, BATCH_SIZE),
        writer
    );
  }
}
