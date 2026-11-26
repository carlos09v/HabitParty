package com.habitparty.application.usecases.social;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import com.habitparty.application.ports.FriendshipRepository;
import com.habitparty.application.ports.SocialNotificationRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.usecases.user.UserTimeResolver;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.achievement.Achievement;
import com.habitparty.core.domain.entities.social.SocialNotification;
import com.habitparty.core.domain.enums.AchievementRarity;
import com.habitparty.core.domain.enums.PrivacyLevel;
import com.habitparty.core.domain.enums.SocialNotificationType;
import com.habitparty.core.domain.enums.UserLevel;

@Service
public class NotifyFriendsMilestoneUseCase {

  private static final Logger log = LoggerFactory.getLogger(NotifyFriendsMilestoneUseCase.class);

  private final FriendshipRepository friendshipRepository;
  private final SocialNotificationRepository notificationRepository;
  private final UserRepository userRepository;
  private final UserTimeResolver timeResolver;
  private TransactionTemplate requiresNewTx;

  public NotifyFriendsMilestoneUseCase(
      FriendshipRepository friendshipRepository,
      SocialNotificationRepository notificationRepository,
      UserRepository userRepository,
      UserTimeResolver timeResolver) {
    this.friendshipRepository = friendshipRepository;
    this.notificationRepository = notificationRepository;
    this.userRepository = userRepository;
    this.timeResolver = timeResolver;
  }

  @Autowired(required = false)
  public void setTransactionManager(PlatformTransactionManager transactionManager) {
    if (transactionManager != null) {
      TransactionTemplate template = new TransactionTemplate(transactionManager);
      template.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
      this.requiresNewTx = template;
    }
  }

  /**
   * Executa em transação isolada {@code REQUIRES_NEW} com captura externa de erro para nunca
   * marcar a transação pai (pagamentos, resgates, conclusão de tarefas) como {@code rollbackOnly}.
   */
  public void notifyAchievementUnlocked(UUID actorId, Achievement achievement) {
    if (actorId == null || achievement == null) {
      return;
    }
    AchievementRarity rarity = achievement.getRarity();
    if (rarity != AchievementRarity.RARE && rarity != AchievementRarity.EPIC && rarity != AchievementRarity.LEGENDARY) {
      return;
    }
    try {
      executeInIsolatedTransaction(() -> doNotifyAchievementUnlocked(actorId, achievement, rarity));
    } catch (Exception e) {
      log.warn("Falha não-bloqueante ao notificar amigos sobre conquista: {}", e.getMessage());
    }
  }

  public void notifyLevelMilestone(UUID actorId, UserLevel newLevel) {
    if (actorId == null || newLevel == null || newLevel.ordinal() < UserLevel.CHALLENGER.ordinal()) {
      return;
    }
    try {
      executeInIsolatedTransaction(() -> doNotifyLevelMilestone(actorId, newLevel));
    } catch (Exception e) {
      log.warn("Falha não-bloqueante ao notificar amigos sobre avanço de nível: {}", e.getMessage());
    }
  }

  private void executeInIsolatedTransaction(Runnable action) {
    if (requiresNewTx != null) {
      requiresNewTx.executeWithoutResult(status -> action.run());
    } else {
      action.run();
    }
  }

  private void doNotifyAchievementUnlocked(UUID actorId, Achievement achievement, AchievementRarity rarity) {
    User actor = userRepository.findById(actorId).orElse(null);
    if (actor == null
        || actor.getProfileVisibility() == PrivacyLevel.PRIVATE
        || actor.getAchievementsVisibility() == PrivacyLevel.PRIVATE) {
      return;
    }

    List<UUID> friendIds = friendshipRepository.findAcceptedFriendIds(actorId);
    if (friendIds.isEmpty()) {
      return;
    }

    Instant now = timeResolver.nowInstant();
    String payload = SocialNotificationPayloadHelper.achievementUnlocked(
        actor,
        achievement.getCode(),
        achievement.getTitle(),
        rarity);

    List<SocialNotification> batch = new ArrayList<>(friendIds.size());
    for (UUID friendId : friendIds) {
      if (!actorId.equals(friendId)) {
        batch.add(SocialNotification.create(
            friendId,
            actorId,
            SocialNotificationType.FRIEND_MILESTONE_ACHIEVEMENT,
            achievement.getId(),
            payload,
            now));
      }
    }
    if (!batch.isEmpty()) {
      notificationRepository.saveAll(batch);
    }
  }

  private void doNotifyLevelMilestone(UUID actorId, UserLevel newLevel) {
    User actor = userRepository.findById(actorId).orElse(null);
    if (actor == null
        || actor.getProfileVisibility() == PrivacyLevel.PRIVATE
        || actor.getStatsVisibility() == PrivacyLevel.PRIVATE) {
      return;
    }

    List<UUID> friendIds = friendshipRepository.findAcceptedFriendIds(actorId);
    if (friendIds.isEmpty()) {
      return;
    }

    Instant now = timeResolver.nowInstant();
    String payload = SocialNotificationPayloadHelper.levelUp(actor, newLevel);

    List<SocialNotification> batch = new ArrayList<>(friendIds.size());
    for (UUID friendId : friendIds) {
      if (!actorId.equals(friendId)) {
        batch.add(SocialNotification.create(
            friendId,
            actorId,
            SocialNotificationType.FRIEND_MILESTONE_LEVEL,
            null,
            payload,
            now));
      }
    }
    if (!batch.isEmpty()) {
      notificationRepository.saveAll(batch);
    }
  }
}
