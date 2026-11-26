package com.habitparty.application.usecases.transaction;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.application.ports.TransactionHistoryRepository.TransactionHistoryFilter;
import com.habitparty.application.ports.TransactionHistoryRepository.TransactionHistorySummary;
import com.habitparty.application.usecases.user.UserTimeResolver;
import com.habitparty.core.domain.entities.TransactionHistory;
import com.habitparty.core.domain.enums.TransactionType;

@Service
@Transactional(readOnly = true)
public class ListUserTransactionsUseCase {
  private final TransactionHistoryRepository port;
  private final UserTimeResolver userTimeResolver;
  private final Clock clock;

  public record DateRangeBounds(LocalDateTime startInclusive, LocalDateTime endExclusive) {}

  public record HistoryPageResult(
      Page<TransactionHistory> page,
      TransactionHistorySummary summary,
      ZoneId userZone) {}

  @Autowired
  public ListUserTransactionsUseCase(
      TransactionHistoryRepository port,
      UserTimeResolver userTimeResolver,
      Clock clock) {
    this.port = port;
    this.userTimeResolver = userTimeResolver;
    this.clock = clock != null ? clock : Clock.systemDefaultZone();
  }

  public ListUserTransactionsUseCase(TransactionHistoryRepository port, Clock clock) {
    this(port, null, clock);
  }

  public ListUserTransactionsUseCase(TransactionHistoryRepository port) {
    this(port, null, Clock.systemDefaultZone());
  }

  public Page<TransactionHistory> execute(UUID userId, String tab, String period, String search, int page, int requestedSize) {
    return executeWithSummary(userId, tab, period, null, null, search, null, null, page, requestedSize).page();
  }

  public Page<TransactionHistory> execute(UUID userId, String tab, int page, int requestedSize) {
    return execute(userId, tab, null, null, page, requestedSize);
  }

  public HistoryPageResult executeWithSummary(
      UUID userId,
      String tab,
      String period,
      LocalDate fromDate,
      LocalDate toDate,
      String search,
      String direction,
      String sort,
      int page,
      int requestedSize) {
    int safePage = Math.max(page, 0);
    int safeSize = Math.min(Math.max(requestedSize, 1), 100);
    ZoneId userZone = userTimeResolver != null ? userTimeResolver.resolveZone(userId) : clock.getZone();
    TransactionHistoryFilter filter = buildFilter(tab, period, fromDate, toDate, search, direction, sort, clock, userZone);

    if (port.supportsDirectPageContent()) {
      TransactionHistorySummary summary = port.summarizeFiltered(userId, filter);
      PageRequest pageable = PageRequest.of(safePage, safeSize);
      List<TransactionHistory> content = (summary.totalCount() > 0L && (long) safePage * safeSize < summary.totalCount())
          ? port.findFilteredPageContent(userId, filter, safePage, safeSize)
          : List.of();
      return new HistoryPageResult(new PageImpl<>(content, pageable, summary.totalCount()), summary, userZone);
    }

    Page<TransactionHistory> resultPage = port.findFiltered(userId, filter, safePage, safeSize);
    TransactionHistorySummary summary = port.summarizeFiltered(userId, filter);
    return new HistoryPageResult(resultPage, summary, userZone);
  }

  public static TransactionHistoryFilter buildFilter(
      String tab,
      String period,
      LocalDate fromDate,
      LocalDate toDate,
      String search,
      String direction,
      String sort,
      Clock clock,
      ZoneId userZone) {
    List<TransactionType> typesToFilter = resolveTypesForTab(tab);
    DateRangeBounds bounds = resolveDateBounds(period, fromDate, toDate, clock, userZone);
    String safeSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
    String safeDirection = normalizeDirection(direction);
    String safeSort = normalizeSort(sort);
    return new TransactionHistoryFilter(
        typesToFilter,
        bounds.startInclusive(),
        bounds.endExclusive(),
        safeSearch,
        safeDirection,
        safeSort);
  }

  public static List<TransactionType> resolveTypesForTab(String tab) {
    if (tab == null || tab.trim().isEmpty() || tab.equalsIgnoreCase("ALL")) {
      return null;
    }
    return getTypesForTab(tab.trim());
  }

  public static LocalDateTime resolveStartDateForPeriod(String period) {
    return resolveStartDateForPeriod(period, Clock.systemDefaultZone());
  }

  public static LocalDateTime resolveStartDateForPeriod(String period, Clock clock) {
    Clock effectiveClock = clock != null ? clock : Clock.systemDefaultZone();
    return resolveStartDateForPeriod(period, effectiveClock, effectiveClock.getZone());
  }

  public static LocalDateTime resolveStartDateForPeriod(String period, Clock clock, ZoneId userZone) {
    return resolveDateBounds(period, null, null, clock, userZone).startInclusive();
  }

  public static DateRangeBounds resolveDateBounds(
      String period,
      LocalDate fromDate,
      LocalDate toDate,
      Clock clock,
      ZoneId userZone) {
    Clock effectiveClock = clock != null ? clock : Clock.systemDefaultZone();
    ZoneId storageZone = effectiveClock.getZone();
    ZoneId effectiveZone = userZone != null ? userZone : storageZone;

    if (fromDate != null || toDate != null) {
      LocalDate normalizedFrom = fromDate;
      LocalDate normalizedTo = toDate;
      if (normalizedFrom != null && normalizedTo != null && normalizedFrom.isAfter(normalizedTo)) {
        LocalDate tmp = normalizedFrom;
        normalizedFrom = normalizedTo;
        normalizedTo = tmp;
      }
      LocalDateTime start = normalizedFrom != null
          ? toStorageStartOfDay(normalizedFrom, effectiveZone, storageZone)
          : null;
      LocalDateTime endExclusive = normalizedTo != null
          ? toStorageStartOfDay(normalizedTo.plusDays(1), effectiveZone, storageZone)
          : null;
      return new DateRangeBounds(start, endExclusive);
    }

    if (period == null || period.trim().isEmpty() || period.equalsIgnoreCase("ALL")) {
      return new DateRangeBounds(null, null);
    }

    LocalDate today = LocalDate.now(effectiveClock.withZone(effectiveZone));
    return switch (period.trim().toUpperCase(Locale.ROOT)) {
      case "TODAY" -> new DateRangeBounds(toStorageStartOfDay(today, effectiveZone, storageZone), null);
      case "7DAYS" -> new DateRangeBounds(toStorageStartOfDay(today.minusDays(6), effectiveZone, storageZone), null);
      case "30DAYS" -> new DateRangeBounds(toStorageStartOfDay(today.minusDays(29), effectiveZone, storageZone), null);
      case "THIS_MONTH" -> new DateRangeBounds(toStorageStartOfDay(today.withDayOfMonth(1), effectiveZone, storageZone), null);
      case "LAST_MONTH" -> {
        LocalDate firstOfThisMonth = today.withDayOfMonth(1);
        LocalDate firstOfLastMonth = firstOfThisMonth.minusMonths(1);
        yield new DateRangeBounds(
            toStorageStartOfDay(firstOfLastMonth, effectiveZone, storageZone),
            toStorageStartOfDay(firstOfThisMonth, effectiveZone, storageZone));
      }
      default -> new DateRangeBounds(null, null);
    };
  }

  private static LocalDateTime toStorageStartOfDay(LocalDate businessDate, ZoneId userZone, ZoneId storageZone) {
    return businessDate.atStartOfDay(userZone)
        .withZoneSameInstant(storageZone)
        .toLocalDateTime();
  }

  private static String normalizeDirection(String direction) {
    if (direction == null || direction.isBlank()) {
      return null;
    }
    String upper = direction.trim().toUpperCase(Locale.ROOT);
    return ("IN".equals(upper) || "OUT".equals(upper)) ? upper : null;
  }

  private static String normalizeSort(String sort) {
    if (sort == null || sort.isBlank()) {
      return "NEWEST";
    }
    String upper = sort.trim().toUpperCase(Locale.ROOT);
    return switch (upper) {
      case "NEWEST", "OLDEST", "HIGHEST_GOLD", "LOWEST_GOLD" -> upper;
      default -> "NEWEST";
    };
  }

  private static List<TransactionType> getTypesForTab(String tab) {
    return switch (tab.toUpperCase(Locale.ROOT)) {
      case "SHOPPING" -> List.of(TransactionType.REWARD_BOUGHT, TransactionType.DEBT_PAID);
      case "BACKPACK" -> List.of(TransactionType.ITEM_CONSUMED, TransactionType.ITEM_DISCARDED);
      case "TASKS" -> List.of(
          TransactionType.HABIT_COMPLETED,
          TransactionType.DAILY_COMPLETED,
          TransactionType.TODO_COMPLETED,
          TransactionType.TASK_COMPLETED,
          TransactionType.TASK_FAILED,
          TransactionType.BAD_HABIT_PENALTY
      );
      case "FOCUS" -> List.of(TransactionType.FOCUS_COMPLETED);
      default -> null;
    };
  }
}
