package com.habitparty.application.usecases.transaction;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.core.domain.entities.TransactionHistory;
import com.habitparty.core.domain.enums.TransactionType;

@Service
public class ListUserTransactionsUseCase {
  private final TransactionHistoryRepository port;
  private final Clock clock;

  @Autowired
  public ListUserTransactionsUseCase(TransactionHistoryRepository port, Clock clock) {
    this.port = port;
    this.clock = clock != null ? clock : Clock.systemDefaultZone();
  }

  public ListUserTransactionsUseCase(TransactionHistoryRepository port) {
    this(port, Clock.systemDefaultZone());
  }

  public Page<TransactionHistory> execute(UUID userId, String tab, String period, String search, int page, int requestedSize) {
    int safePage = Math.max(page, 0);
    int safeSize = Math.min(Math.max(requestedSize, 1), 100);
    List<TransactionType> typesToFilter = resolveTypesForTab(tab);
    LocalDateTime startDate = resolveStartDateForPeriod(period, clock);

    return port.findFiltered(userId, typesToFilter, startDate, search, safePage, safeSize);
  }

  public Page<TransactionHistory> execute(UUID userId, String tab, int page, int requestedSize) {
    return execute(userId, tab, null, null, page, requestedSize);
  }

  public static List<TransactionType> resolveTypesForTab(String tab) {
    if (tab == null || tab.trim().isEmpty() || tab.equalsIgnoreCase("ALL")) {
      return null;
    }
    return getTypesForTab(tab);
  }

  public static LocalDateTime resolveStartDateForPeriod(String period) {
    return resolveStartDateForPeriod(period, Clock.systemDefaultZone());
  }

  public static LocalDateTime resolveStartDateForPeriod(String period, Clock clock) {
    if (period == null || period.trim().isEmpty() || period.equalsIgnoreCase("ALL")) {
      return null;
    }
    Clock effectiveClock = clock != null ? clock : Clock.systemDefaultZone();
    return switch (period.toUpperCase()) {
      case "TODAY" -> LocalDate.now(effectiveClock)
          .atStartOfDay(effectiveClock.getZone())
          .withZoneSameInstant(ZoneId.systemDefault())
          .toLocalDateTime();
      case "7DAYS" -> LocalDateTime.now().minusDays(7);
      case "30DAYS" -> LocalDateTime.now().minusDays(30);
      default -> null;
    };
  }

  private static List<TransactionType> getTypesForTab(String tab) {
    return switch (tab.toUpperCase()) {
      case "SHOPPING" -> List.of(TransactionType.REWARD_BOUGHT);
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
      default -> List.of(TransactionType.values());
    };
  }
}