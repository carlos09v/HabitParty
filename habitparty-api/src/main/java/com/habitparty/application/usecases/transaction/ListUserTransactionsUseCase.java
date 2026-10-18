package com.habitparty.application.usecases.transaction;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.core.domain.entities.TransactionHistory;
import com.habitparty.core.domain.enums.TransactionType;

@Service
public class ListUserTransactionsUseCase {
  private final TransactionHistoryRepository port;

  public ListUserTransactionsUseCase(TransactionHistoryRepository port) {
    this.port = port;
  }

  public Page<TransactionHistory> execute(UUID userId, String tab, String period, String search, int page, int requestedSize) {
    int safeSize = Math.min(requestedSize, 16);
    List<TransactionType> typesToFilter = (tab == null || tab.trim().isEmpty() || tab.equalsIgnoreCase("ALL"))
        ? null
        : getTypesForTab(tab);

    LocalDateTime startDate = resolveStartDateForPeriod(period);

    return port.findFiltered(userId, typesToFilter, startDate, search, page, safeSize);
  }

  public Page<TransactionHistory> execute(UUID userId, String tab, int page, int requestedSize) {
    return execute(userId, tab, null, null, page, requestedSize);
  }

  private LocalDateTime resolveStartDateForPeriod(String period) {
    if (period == null || period.trim().isEmpty() || period.equalsIgnoreCase("ALL")) {
      return null;
    }
    return switch (period.toUpperCase()) {
      case "TODAY" -> LocalDateTime.now().toLocalDate().atStartOfDay();
      case "7DAYS" -> LocalDateTime.now().minusDays(7);
      case "30DAYS" -> LocalDateTime.now().minusDays(30);
      default -> null;
    };
  }

  private List<TransactionType> getTypesForTab(String tab) {
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