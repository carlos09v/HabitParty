package com.habitparty.application.usecases.user;

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

  public EffectiveStreakResolver(TransactionHistoryRepository transactionPort) {
    this.transactionPort = transactionPort;
  }

  public int resolve(User user) {
    if (user == null) {
      return 0;
    }
    int effectiveStreak = user.getCurrentStreak();
    if (effectiveStreak > 0 && transactionPort != null
        && !transactionPort.hasCompletedTasksSinceYesterday(user.getId())) {
      return 0;
    }
    return effectiveStreak;
  }

  public UserWithEffectiveStreak wrap(User user) {
    return new UserWithEffectiveStreak(user, resolve(user));
  }
}
