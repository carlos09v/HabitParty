package com.habitparty.application.usecases.user;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.habitparty.application.ports.FocusRecordRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.core.domain.entities.User;

/**
 * Resolve o streak efetivo em leitura para evitar exibir ofensivas expiradas antes do job noturno.
 */
@Service
public class EffectiveStreakResolver {

  public record UserWithEffectiveStreak(User user, int effectiveStreak) {}

  private final TransactionHistoryRepository transactionPort;
  private final FocusRecordRepository focusRecordPort;
  private final Clock clock;

  @Autowired
  public EffectiveStreakResolver(
      TransactionHistoryRepository transactionPort,
      FocusRecordRepository focusRecordPort,
      Clock clock) {
    this.transactionPort = transactionPort;
    this.focusRecordPort = focusRecordPort;
    this.clock = clock != null ? clock : Clock.systemDefaultZone();
  }

  public EffectiveStreakResolver(TransactionHistoryRepository transactionPort, Clock clock) {
    this(transactionPort, null, clock);
  }

  public EffectiveStreakResolver(TransactionHistoryRepository transactionPort) {
    this(transactionPort, null, Clock.systemDefaultZone());
  }

  public int resolve(User user) {
    if (user == null) {
      return 0;
    }
    int effectiveStreak = user.getCurrentStreak();
    if (effectiveStreak <= 0) {
      return 0;
    }

    ZoneId effectiveZone = user.resolveZoneId(ZoneId.of(User.DEFAULT_TIMEZONE));
    LocalDate today = LocalDate.now(clock.withZone(effectiveZone));
    LocalDate lastStreakDate = user.getLastStreakDate();
    if (lastStreakDate != null) {
      return !lastStreakDate.isBefore(today.minusDays(1)) ? effectiveStreak : 0;
    }

    if (transactionPort == null) {
      return effectiveStreak;
    }

    if (focusRecordPort == null) {
      return transactionPort.hasCompletedTasksSinceYesterday(user.getId(), effectiveZone)
          ? effectiveStreak
          : 0;
    }

    boolean qualifiedToday = transactionPort.countCompletedTasksToday(user.getId(), effectiveZone) > 0
        || GlobalStreakSupport.hasQualifiedFocusOnDate(user.getId(), today, effectiveZone, focusRecordPort);
    if (qualifiedToday) {
      return effectiveStreak;
    }

    boolean qualifiedYesterday = GlobalStreakSupport.hasQualifiedYesterday(
        user.getId(), effectiveZone, today, transactionPort, focusRecordPort);
    return qualifiedYesterday ? effectiveStreak : 0;
  }

  public Map<UUID, Integer> resolveBatch(Collection<User> users) {
    if (users == null || users.isEmpty()) {
      return Map.of();
    }
    Map<UUID, Integer> resolved = new HashMap<>(users.size());
    Map<UUID, LocalDate> minDateByUserId = new HashMap<>();
    Map<UUID, ZoneId> zoneByUserId = new HashMap<>();

    for (User user : users) {
      if (user == null || user.getId() == null) {
        continue;
      }
      int streak = user.getCurrentStreak();
      if (streak <= 0) {
        resolved.put(user.getId(), 0);
        continue;
      }
      ZoneId effectiveZone = user.resolveZoneId(ZoneId.of(User.DEFAULT_TIMEZONE));
      LocalDate yesterday = LocalDate.now(clock.withZone(effectiveZone)).minusDays(1);
      LocalDate lastStreakDate = user.getLastStreakDate();
      if (lastStreakDate != null) {
        resolved.put(user.getId(), !lastStreakDate.isBefore(yesterday) ? streak : 0);
        continue;
      }
      if (transactionPort == null) {
        resolved.put(user.getId(), streak);
        continue;
      }
      minDateByUserId.put(user.getId(), yesterday);
      zoneByUserId.put(user.getId(), effectiveZone);
    }

    if (minDateByUserId.isEmpty()) {
      return resolved;
    }

    Set<UUID> qualifiedUsers = GlobalStreakSupport.findQualifiedUsersSinceDates(
        minDateByUserId, zoneByUserId, transactionPort, focusRecordPort, clock);

    for (User user : users) {
      if (user == null || user.getId() == null || resolved.containsKey(user.getId())) {
        continue;
      }
      resolved.put(user.getId(), qualifiedUsers.contains(user.getId()) ? user.getCurrentStreak() : 0);
    }

    return resolved;
  }

  public UserWithEffectiveStreak wrap(User user) {
    return new UserWithEffectiveStreak(user, resolve(user));
  }
}
