package com.habitparty.application.usecases.transaction;

import java.io.Writer;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Locale;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Supplier;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionOperations;
import org.springframework.transaction.support.TransactionTemplate;

import com.habitparty.application.ports.TransactionCsvExporterPort;
import com.habitparty.application.ports.TransactionCsvExporterPort.CsvExportOptions;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.application.ports.TransactionHistoryRepository.TransactionHistoryFilter;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.usecases.user.UserTimeResolver;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.enums.UserExperienceMode;

@Service
public class ExportTransactionsCsvUseCase {
  public static final int MAX_EXPORT_ROWS = 50_000;
  private static final int BATCH_SIZE = 500;

  private final TransactionHistoryRepository transactionHistoryRepository;
  private final TransactionCsvExporterPort exporterPort;
  private final UserTimeResolver userTimeResolver;
  private final UserRepository userRepository;
  private TransactionOperations readOnlyTransactionOperations;

  @Autowired
  public ExportTransactionsCsvUseCase(
      TransactionHistoryRepository transactionHistoryRepository,
      TransactionCsvExporterPort exporterPort,
      @Nullable UserTimeResolver userTimeResolver,
      @Nullable UserRepository userRepository) {
    this.transactionHistoryRepository = transactionHistoryRepository;
    this.exporterPort = exporterPort;
    this.userTimeResolver = userTimeResolver;
    this.userRepository = userRepository;
  }

  public ExportTransactionsCsvUseCase(
      TransactionHistoryRepository transactionHistoryRepository,
      TransactionCsvExporterPort exporterPort,
      @Nullable UserTimeResolver userTimeResolver) {
    this(transactionHistoryRepository, exporterPort, userTimeResolver, null);
  }

  public ExportTransactionsCsvUseCase(
      TransactionHistoryRepository transactionHistoryRepository,
      TransactionCsvExporterPort exporterPort) {
    this(transactionHistoryRepository, exporterPort, null, null);
  }

  @Autowired(required = false)
  public void setTransactionManager(@Nullable PlatformTransactionManager transactionManager) {
    if (transactionManager != null) {
      TransactionTemplate template = new TransactionTemplate(transactionManager);
      template.setReadOnly(true);
      this.readOnlyTransactionOperations = template;
    } else {
      this.readOnlyTransactionOperations = null;
    }
  }

  public void execute(UUID userId, Writer writer) {
    execute(userId, null, null, null, writer);
  }

  public void execute(UUID userId, String tab, String period, String search, Writer writer) {
    execute(userId, tab, period, null, null, search, null, null, null, null, writer, null);
  }

  public void execute(
      UUID userId,
      String tab,
      String period,
      LocalDate fromDate,
      LocalDate toDate,
      String search,
      String direction,
      Locale locale,
      String dateFormat,
      String timeFormat,
      Writer writer,
      Runnable onBeforeWriteFirstByte) {
    execute(
        userId,
        tab,
        period,
        fromDate,
        toDate,
        search,
        direction,
        "NEWEST",
        locale,
        dateFormat,
        timeFormat,
        writer,
        onBeforeWriteFirstByte);
  }

  public void execute(
      UUID userId,
      String tab,
      String period,
      LocalDate fromDate,
      LocalDate toDate,
      String search,
      String direction,
      String sort,
      Locale locale,
      String dateFormat,
      String timeFormat,
      Writer writer,
      Runnable onBeforeWriteFirstByte) {
    Clock effectiveClock = userTimeResolver != null ? userTimeResolver.clock() : Clock.systemDefaultZone();
    ExportUserContext userContext = executeReadOnly(() -> {
      User user = userRepository != null ? userRepository.findById(userId).orElse(null) : null;
      ZoneId resolvedZone = user != null
          ? user.resolveZoneId(effectiveClock.getZone())
          : (userTimeResolver != null ? userTimeResolver.resolveZone(userId) : effectiveClock.getZone());
      UserExperienceMode resolvedMode = user != null ? user.getExperienceMode() : UserExperienceMode.PRODUCTIVITY;
      return new ExportUserContext(resolvedZone, resolvedMode);
    });

    ZoneId userZone = userContext.userZone();
    UserExperienceMode experienceMode = userContext.experienceMode();

    TransactionHistoryFilter filter = ListUserTransactionsUseCase.buildFilter(
        tab, period, fromDate, toDate, search, direction, sort, effectiveClock, userZone);

    CsvExportOptions options = new CsvExportOptions(
        userZone,
        locale != null ? locale : Locale.forLanguageTag("pt-BR"),
        experienceMode,
        dateFormat,
        timeFormat,
        effectiveClock.getZone(),
        MAX_EXPORT_ROWS);

    boolean useKeyset = "NEWEST".equals(filter.sort()) || "OLDEST".equals(filter.sort());
    AtomicInteger pageCursor = new AtomicInteger(0);

    // Cada fatia executa sua própria transação curta read-only e devolve a conexão ao pool
    // enquanto os bytes CSV são serializados e transmitidos ao cliente HTTP.
    exporterPort.exportTransactionsKeyset(
        (cursorCreatedAt, cursorId) -> executeReadOnly(() -> useKeyset
            ? transactionHistoryRepository.findFilteredSliceAfterCursor(
                userId, filter, cursorCreatedAt, cursorId, BATCH_SIZE)
            : transactionHistoryRepository.findFilteredPageContent(
                userId, filter, pageCursor.getAndIncrement(), BATCH_SIZE)),
        BATCH_SIZE,
        options,
        writer,
        onBeforeWriteFirstByte);
  }

  private <T> T executeReadOnly(Supplier<T> action) {
    if (readOnlyTransactionOperations == null) {
      return action.get();
    }
    return readOnlyTransactionOperations.execute(status -> action.get());
  }

  private record ExportUserContext(ZoneId userZone, UserExperienceMode experienceMode) {}
}
