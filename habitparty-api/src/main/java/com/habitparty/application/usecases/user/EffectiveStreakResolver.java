package com.habitparty.application.usecases.user;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.core.domain.entities.User;

/**
 * Resolve o streak efetivo em leitura para evitar exibir ofensivas expiradas antes do job noturno.
 */
@Service
public class EffectiveStreakResolver {

  public record UserWithEffectiveStreak(User user, int effectiveStreak) {}

  private final TransactionHistoryRepository transactionPort;
  private final Clock clock;

  @Autowired
  public EffectiveStreakResolver(TransactionHistoryRepository transactionPort, Clock clock) {
    this.transactionPort = transactionPort;
    this.clock = clock != null ? clock : Clock.systemDefaultZone();
  }

  public EffectiveStreakResolver(TransactionHistoryRepository transactionPort) {
    this(transactionPort, Clock.systemDefaultZone());
  }

  public int resolve(User user) {
    if (user == null) {
      return 0;
    }
    int effectiveStreak = user.getCurrentStreak();
    if (effectiveStreak > 0 && transactionPort != null
        && !transactionPort.hasCompletedTasksSinceYesterday(user.getId(), user.resolveZoneId(clock.getZone()))) {
      return 0;
    }
    return effectiveStreak;
  }

  public Map<UUID, Integer> resolveBatch(Collection<User> users) {
    if (users == null || users.isEmpty()) {
      return Map.of();
    }
    Map<UUID, Integer> resolved = new HashMap<>(users.size());
    Map<UUID, LocalDateTime> cutoffByUserId = new HashMap<>();
    LocalDateTime earliestCutoff = null;

    for (User user : users) {
      if (user == null || user.getId() == null) {
        continue;
      }
      int streak = user.getCurrentStreak();
      if (streak <= 0 || transactionPort == null) {
        resolved.put(user.getId(), Math.max(0, streak));
        continue;
      }
      LocalDateTime userCutoff = computeSinceYesterdayCutoff(user);
      cutoffByUserId.put(user.getId(), userCutoff);
      if (earliestCutoff == null || userCutoff.isBefore(earliestCutoff)) {
        earliestCutoff = userCutoff;
      }
    }

    if (cutoffByUserId.isEmpty()) {
      return resolved;
    }

    List<UUID> idsToCheck = List.copyOf(cutoffByUserId.keySet());
    Map<UUID, LocalDateTime> lastCompletedByUser = transactionPort.findLastCompletedTaskAtByUserIds(idsToCheck, earliestCutoff);

    for (User user : users) {
      if (user == null || user.getId() == null || resolved.containsKey(user.getId())) {
        continue;
      }
      LocalDateTime userCutoff = cutoffByUserId.get(user.getId());
      LocalDateTime lastCompleted = lastCompletedByUser.get(user.getId());
      boolean valid = lastCompleted != null && !lastCompleted.isBefore(userCutoff);
      resolved.put(user.getId(), valid ? user.getCurrentStreak() : 0);
    }

    return resolved;
  }

  private LocalDateTime computeSinceYesterdayCutoff(User user) {
    ZoneId effectiveZone = user.resolveZoneId(clock.getZone());
    LocalDate yesterday = LocalDate.now(clock.withZone(effectiveZone)).minusDays(1);
    return yesterday.atTime(LocalTime.MIN)
        .atZone(effectiveZone)
        .withZoneSameInstant(ZoneId.systemDefault())
        .toLocalDateTime();
  }

  public UserWithEffectiveStreak wrap(User user) {
    return new UserWithEffectiveStreak(user, resolve(user));
  }
}
