package com.habitparty.application.usecases.admin;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.ZoneId;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.FocusRecordRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.usecases.achievement.EvaluateUserAchievementsUseCase;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.focus.FocusRecord;
import com.habitparty.core.domain.entities.focus.FocusRewardRecalculationPlanner;
import com.habitparty.core.domain.entities.focus.FocusRewardRecalculationPlanner.RecordAdjustment;
import com.habitparty.core.domain.entities.focus.FocusRewardRecalculationPlanner.UserRecalculationPlan;
import com.habitparty.core.domain.enums.UserLevel;

/**
 * Recalcula sob demanda sessões produtivas de foco existentes com a calculadora atual,
 * aplicando apenas acréscimos positivos em focus_records, transaction_history e user_stats,
 * além de alinhar transaction_history.created_at de registros FOCUS_COMPLETED com end_time.
 */
@Service
public class RecalculateFocusRewardsUseCase {

  public record RecalculationResult(
      boolean dryRun,
      long recordsTimestampSynced,
      long recordsRewardUpgraded,
      long usersAffected,
      int totalXpAdded,
      BigDecimal totalCoinsAdded) {}

  private final UserRepository userRepository;
  private final FocusRecordRepository focusRecordRepository;
  private final TransactionHistoryRepository transactionHistoryRepository;
  private EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase;

  @Autowired
  public RecalculateFocusRewardsUseCase(
      UserRepository userRepository,
      FocusRecordRepository focusRecordRepository,
      TransactionHistoryRepository transactionHistoryRepository) {
    this.userRepository = userRepository;
    this.focusRecordRepository = focusRecordRepository;
    this.transactionHistoryRepository = transactionHistoryRepository;
  }

  @Autowired(required = false)
  public void setEvaluateUserAchievementsUseCase(
      EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase) {
    this.evaluateUserAchievementsUseCase = evaluateUserAchievementsUseCase;
  }

  @Transactional
  public RecalculationResult execute(boolean dryRun) {
    long timestampsSynced = dryRun
        ? transactionHistoryRepository.countMismatchedFocusCompletedTimestamps()
        : transactionHistoryRepository.syncFocusCompletedTimestamps();

    long recordsUpgraded = 0L;
    long usersAffected = 0L;
    int totalXpAdded = 0;
    BigDecimal totalCoinsAdded = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

    ZoneId storageZone = ZoneId.systemDefault();
    List<User> users = userRepository.findAll();

    for (User user : users) {
      if (user == null || user.getId() == null) {
        continue;
      }
      List<FocusRecord> records = focusRecordRepository.findAllByUserId(user.getId());
      if (records == null || records.isEmpty()) {
        continue;
      }

      ZoneId userZone = user.resolveZoneId(storageZone);
      UserRecalculationPlan plan = FocusRewardRecalculationPlanner.planForUser(
          records, userZone, storageZone);
      if (!plan.hasChanges()) {
        continue;
      }

      usersAffected++;
      recordsUpgraded += plan.adjustments().size();
      totalXpAdded += plan.totalXpDelta();
      totalCoinsAdded = totalCoinsAdded.add(plan.totalCoinsDelta()).setScale(2, RoundingMode.HALF_UP);

      if (dryRun) {
        continue;
      }

      for (RecordAdjustment adj : plan.adjustments()) {
        focusRecordRepository.updateFocusRewards(adj.recordId(), adj.newXp(), adj.newCoins());
        transactionHistoryRepository.updateFocusRewardSnapshot(
            adj.recordId(), user.getId(), adj.newXp(), adj.newCoins());
      }

      UserLevel levelBefore = user.getCurrentLevel();
      if (plan.totalXpDelta() > 0) {
        user.addXp(plan.totalXpDelta());
      }
      if (plan.totalCoinsDelta().compareTo(BigDecimal.ZERO) > 0) {
        user.addCoins(plan.totalCoinsDelta());
      }
      UserLevel levelAfter = user.getCurrentLevel();
      userRepository.save(user);

      if (evaluateUserAchievementsUseCase != null) {
        evaluateUserAchievementsUseCase.execute(user);
        if (levelAfter.ordinal() > levelBefore.ordinal()) {
          evaluateUserAchievementsUseCase.notifyLevelMilestoneIfReached(user.getId(), levelAfter);
        }
      }
    }

    return new RecalculationResult(
        dryRun,
        timestampsSynced,
        recordsUpgraded,
        usersAffected,
        totalXpAdded,
        totalCoinsAdded);
  }
}
