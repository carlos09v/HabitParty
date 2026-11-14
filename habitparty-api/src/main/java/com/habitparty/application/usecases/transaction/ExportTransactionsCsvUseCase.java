package com.habitparty.application.usecases.transaction;

import java.io.Writer;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.TransactionCsvExporterPort;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.application.usecases.user.UserTimeResolver;
import com.habitparty.core.domain.enums.TransactionType;

@Service
@Transactional(readOnly = true)
public class ExportTransactionsCsvUseCase {
  private static final int BATCH_SIZE = 500;

  private final TransactionHistoryRepository transactionHistoryRepository;
  private final TransactionCsvExporterPort exporterPort;
  private final UserTimeResolver userTimeResolver;

  @Autowired
  public ExportTransactionsCsvUseCase(
      TransactionHistoryRepository transactionHistoryRepository,
      TransactionCsvExporterPort exporterPort,
      UserTimeResolver userTimeResolver) {
    this.transactionHistoryRepository = transactionHistoryRepository;
    this.exporterPort = exporterPort;
    this.userTimeResolver = userTimeResolver;
  }

  public ExportTransactionsCsvUseCase(
      TransactionHistoryRepository transactionHistoryRepository,
      TransactionCsvExporterPort exporterPort) {
    this(transactionHistoryRepository, exporterPort, null);
  }

  public void execute(UUID userId, Writer writer) {
    execute(userId, null, null, null, writer);
  }

  public void execute(UUID userId, String tab, String period, String search, Writer writer) {
    List<TransactionType> typesToFilter = ListUserTransactionsUseCase.resolveTypesForTab(tab);
    Clock effectiveClock = userTimeResolver != null ? userTimeResolver.clock() : Clock.systemDefaultZone();
    ZoneId userZone = userTimeResolver != null ? userTimeResolver.resolveZone(userId) : effectiveClock.getZone();
    LocalDateTime startDate = ListUserTransactionsUseCase.resolveStartDateForPeriod(period, effectiveClock, userZone);
    String safeSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;

    if (typesToFilter == null && startDate == null && safeSearch == null) {
      exporterPort.exportTransactions(
          page -> transactionHistoryRepository.findAllByUserId(userId, page, BATCH_SIZE),
          writer,
          userZone
      );
      return;
    }

    exporterPort.exportTransactions(
        page -> transactionHistoryRepository.findFiltered(userId, typesToFilter, startDate, safeSearch, page, BATCH_SIZE),
        writer,
        userZone
    );
  }
}
