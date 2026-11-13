package com.habitparty.application.usecases.achievement;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.AchievementRepository;
import com.habitparty.application.ports.ProfileHighlightRepository;
import com.habitparty.application.ports.UserAchievementRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.achievement.Achievement;
import com.habitparty.core.domain.entities.achievement.ProfileHighlight;
import com.habitparty.core.domain.entities.achievement.UserAchievement;
import com.habitparty.core.domain.enums.AchievementCode;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class GetUserShowcaseUseCase {
  private final UserRepository userPort;
  private final AchievementRepository achievementPort;
  private final UserAchievementRepository userAchievementPort;
  private final ProfileHighlightRepository profileHighlightPort;
  private final EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase;
  private final com.habitparty.application.usecases.user.EffectiveStreakResolver effectiveStreakResolver;

  @org.springframework.beans.factory.annotation.Autowired
  public GetUserShowcaseUseCase(
      UserRepository userPort,
      AchievementRepository achievementPort,
      UserAchievementRepository userAchievementPort,
      ProfileHighlightRepository profileHighlightPort,
      EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase,
      com.habitparty.application.usecases.user.EffectiveStreakResolver effectiveStreakResolver) {
    this.userPort = userPort;
    this.achievementPort = achievementPort;
    this.userAchievementPort = userAchievementPort;
    this.profileHighlightPort = profileHighlightPort;
    this.evaluateUserAchievementsUseCase = evaluateUserAchievementsUseCase;
    this.effectiveStreakResolver = effectiveStreakResolver != null
        ? effectiveStreakResolver
        : new com.habitparty.application.usecases.user.EffectiveStreakResolver(null);
  }

  public GetUserShowcaseUseCase(
      UserRepository userPort,
      AchievementRepository achievementPort,
      UserAchievementRepository userAchievementPort,
      ProfileHighlightRepository profileHighlightPort,
      EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase) {
    this(
        userPort,
        achievementPort,
        userAchievementPort,
        profileHighlightPort,
        evaluateUserAchievementsUseCase,
        new com.habitparty.application.usecases.user.EffectiveStreakResolver(null));
  }

  public record AchievementProgressItem(
      Achievement achievement,
      boolean unlocked,
      LocalDateTime unlockedAt,
      boolean seen,
      int currentValue,
      int progressPercent) {}

  public record UserShowcaseResult(
      User user,
      int effectiveStreak,
      List<ProfileHighlight> highlights,
      List<AchievementProgressItem> achievements,
      int unlockedCount,
      int totalAchievements,
      int totalAchievementPoints,
      int maxPossiblePoints) {}

  @Transactional
  public UserShowcaseResult execute(UUID userId) {
    User user = userPort.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

    List<ProfileHighlight> highlights = profileHighlightPort.findAllByUserIdOrderByDisplayOrder(userId);
    int highlightsCount = highlights.size();

    // Avalia conquistas pendentes reutilizando os destaques já carregados e evita reconsultar catálogo/desbloqueios
    var snapshot = evaluateUserAchievementsUseCase.executeWithSnapshot(user, highlights);
    List<Achievement> catalog = !snapshot.catalog().isEmpty()
        ? snapshot.catalog()
        : achievementPort.findAllOrdered();
    List<UserAchievement> userUnlocks = !snapshot.allUserUnlocks().isEmpty()
        ? snapshot.allUserUnlocks()
        : userAchievementPort.findAllByUserId(userId);

    Map<UUID, UserAchievement> unlockMap = userUnlocks.stream()
        .collect(Collectors.toMap(UserAchievement::getAchievementId, Function.identity(), (a, b) -> a));

    int unlockedCount = 0;
    int totalPoints = 0;
    int maxPoints = 0;

    List<AchievementProgressItem> items = new java.util.ArrayList<>(catalog.size());
    for (Achievement achievement : catalog) {
      maxPoints += achievement.getPoints();
      UserAchievement unlock = unlockMap.get(achievement.getId());
      boolean isUnlocked = unlock != null;

      int rawCurrent = AchievementCode.fromString(achievement.getCode())
          .map(code -> code.extractCurrentProgress(user, highlightsCount))
          .orElse(isUnlocked ? achievement.getTargetValue() : 0);

      int clampedCurrent = isUnlocked
          ? Math.max(rawCurrent, achievement.getTargetValue())
          : Math.min(rawCurrent, achievement.getTargetValue());

      int percent = achievement.getTargetValue() > 0
          ? Math.min(100, Math.round((clampedCurrent * 100.0f) / achievement.getTargetValue()))
          : (isUnlocked ? 100 : 0);

      if (isUnlocked) {
        unlockedCount++;
        totalPoints += achievement.getPoints();
      }

      items.add(new AchievementProgressItem(
          achievement,
          isUnlocked,
          isUnlocked ? unlock.getUnlockedAt() : null,
          !isUnlocked || unlock.isSeen(),
          clampedCurrent,
          isUnlocked ? 100 : percent));
    }

    return new UserShowcaseResult(
        user,
        effectiveStreakResolver.resolve(user),
        highlights,
        items,
        unlockedCount,
        catalog.size(),
        totalPoints,
        maxPoints);
  }
}
