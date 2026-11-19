package com.habitparty.application.usecases.achievement;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.AchievementRepository;
import com.habitparty.application.ports.ArtifactRepository;
import com.habitparty.application.ports.ProfileHighlightRepository;
import com.habitparty.application.ports.UserAchievementRepository;
import com.habitparty.application.ports.UserArtifactRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.usecases.task.DailyResetUseCase;
import com.habitparty.application.usecases.user.EffectiveStreakResolver;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.achievement.Achievement;
import com.habitparty.core.domain.entities.achievement.Artifact;
import com.habitparty.core.domain.entities.achievement.ProfileHighlight;
import com.habitparty.core.domain.entities.achievement.UserAchievement;
import com.habitparty.core.domain.entities.achievement.UserArtifact;
import com.habitparty.core.domain.enums.AchievementCode;
import com.habitparty.core.domain.enums.ArtifactSourceType;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class GetUserShowcaseUseCase {
  private final UserRepository userPort;
  private final AchievementRepository achievementPort;
  private final UserAchievementRepository userAchievementPort;
  private final ProfileHighlightRepository profileHighlightPort;
  private final EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase;
  private final EffectiveStreakResolver effectiveStreakResolver;
  private final DailyResetUseCase dailyResetUseCase;
  private final ArtifactRepository artifactPort;
  private final UserArtifactRepository userArtifactPort;

  @Autowired
  public GetUserShowcaseUseCase(
      UserRepository userPort,
      AchievementRepository achievementPort,
      UserAchievementRepository userAchievementPort,
      ProfileHighlightRepository profileHighlightPort,
      EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase,
      @Nullable EffectiveStreakResolver effectiveStreakResolver,
      @Nullable DailyResetUseCase dailyResetUseCase,
      @Nullable ArtifactRepository artifactPort,
      @Nullable UserArtifactRepository userArtifactPort) {
    this.userPort = userPort;
    this.achievementPort = achievementPort;
    this.userAchievementPort = userAchievementPort;
    this.profileHighlightPort = profileHighlightPort;
    this.evaluateUserAchievementsUseCase = evaluateUserAchievementsUseCase;
    this.effectiveStreakResolver = effectiveStreakResolver != null
        ? effectiveStreakResolver
        : new EffectiveStreakResolver(null);
    this.dailyResetUseCase = dailyResetUseCase;
    this.artifactPort = artifactPort;
    this.userArtifactPort = userArtifactPort;
  }

  public GetUserShowcaseUseCase(
      UserRepository userPort,
      AchievementRepository achievementPort,
      UserAchievementRepository userAchievementPort,
      ProfileHighlightRepository profileHighlightPort,
      EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase,
      @Nullable EffectiveStreakResolver effectiveStreakResolver,
      @Nullable DailyResetUseCase dailyResetUseCase) {
    this(
        userPort,
        achievementPort,
        userAchievementPort,
        profileHighlightPort,
        evaluateUserAchievementsUseCase,
        effectiveStreakResolver,
        dailyResetUseCase,
        null,
        null);
  }

  public GetUserShowcaseUseCase(
      UserRepository userPort,
      AchievementRepository achievementPort,
      UserAchievementRepository userAchievementPort,
      ProfileHighlightRepository profileHighlightPort,
      EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase,
      EffectiveStreakResolver effectiveStreakResolver) {
    this(
        userPort,
        achievementPort,
        userAchievementPort,
        profileHighlightPort,
        evaluateUserAchievementsUseCase,
        effectiveStreakResolver,
        null,
        null,
        null);
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
        new EffectiveStreakResolver(null),
        null,
        null,
        null);
  }

  public record AchievementProgressItem(
      Achievement achievement,
      boolean unlocked,
      LocalDateTime unlockedAt,
      boolean seen,
      int currentValue,
      int progressPercent,
      @Nullable Artifact grantedArtifact) {
    public AchievementProgressItem(
        Achievement achievement,
        boolean unlocked,
        LocalDateTime unlockedAt,
        boolean seen,
        int currentValue,
        int progressPercent) {
      this(achievement, unlocked, unlockedAt, seen, currentValue, progressPercent, null);
    }
  }

  public record ArtifactProgressItem(
      Artifact artifact,
      boolean unlocked,
      LocalDateTime unlockedAt,
      String obtainedSource,
      boolean seen) {}

  public record UserShowcaseResult(
      User user,
      int effectiveStreak,
      List<ProfileHighlight> highlights,
      List<AchievementProgressItem> achievements,
      int unlockedCount,
      int totalAchievements,
      int totalAchievementPoints,
      int maxPossiblePoints,
      List<ArtifactProgressItem> artifacts,
      int unlockedArtifactsCount,
      int totalArtifactsCount) {
    public UserShowcaseResult(
        User user,
        int effectiveStreak,
        List<ProfileHighlight> highlights,
        List<AchievementProgressItem> achievements,
        int unlockedCount,
        int totalAchievements,
        int totalAchievementPoints,
        int maxPossiblePoints) {
      this(
          user,
          effectiveStreak,
          highlights,
          achievements,
          unlockedCount,
          totalAchievements,
          totalAchievementPoints,
          maxPossiblePoints,
          List.of(),
          0,
          0);
    }
  }

  @Transactional
  public UserShowcaseResult execute(UUID userId) {
    if (dailyResetUseCase != null) {
      dailyResetUseCase.resetUserIfDue(userId);
    }
    User user = userPort.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

    List<ProfileHighlight> highlights = profileHighlightPort.findAllByUserIdOrderByDisplayOrder(userId);

    // Avalia conquistas pendentes reutilizando os destaques já carregados e evita reconsultar catálogo/desbloqueios/artefatos
    var snapshot = evaluateUserAchievementsUseCase.executeWithSnapshot(user, highlights);
    List<Achievement> catalog = !snapshot.catalog().isEmpty()
        ? snapshot.catalog()
        : achievementPort.findAllOrdered();
    List<UserAchievement> userUnlocks = !snapshot.allUserUnlocks().isEmpty()
        ? snapshot.allUserUnlocks()
        : userAchievementPort.findAllByUserId(userId);

    return buildShowcaseResult(
        user,
        highlights,
        catalog,
        userUnlocks,
        snapshot.artifactCatalog(),
        snapshot.userArtifacts());
  }

  /**
   * Leitura pura da vitrine (sem mutações de reset diário ou escrita de conquistas),
   * segura para consultas de outros visitantes dentro de transações @Transactional(readOnly = true).
   */
  @Transactional(readOnly = true)
  public UserShowcaseResult executeReadOnly(User preloadedUser) {
    if (preloadedUser == null || preloadedUser.getId() == null) {
      throw new ResourceNotFoundException("Usuário não encontrado.");
    }
    UUID userId = preloadedUser.getId();
    List<ProfileHighlight> highlights = profileHighlightPort.findAllByUserIdOrderByDisplayOrder(userId);
    List<Achievement> catalog = achievementPort.findAllOrdered();
    List<UserAchievement> userUnlocks = userAchievementPort.findAllByUserId(userId);
    return buildShowcaseResult(preloadedUser, highlights, catalog, userUnlocks, null, null);
  }

  private UserShowcaseResult buildShowcaseResult(
      User user,
      List<ProfileHighlight> highlights,
      List<Achievement> catalog,
      List<UserAchievement> userUnlocks,
      List<Artifact> preloadedArtifactCatalog,
      List<UserArtifact> preloadedUserArtifacts) {
    int highlightsCount = highlights.size();
    Map<UUID, UserAchievement> unlockMap = userUnlocks.stream()
        .collect(Collectors.toMap(UserAchievement::getAchievementId, Function.identity(), (a, b) -> a));

    List<Artifact> artifactCatalog = preloadedArtifactCatalog != null
        ? preloadedArtifactCatalog
        : (artifactPort != null ? artifactPort.findAllOrdered() : List.of());
    List<UserArtifact> userArtifacts = preloadedUserArtifacts != null
        ? preloadedUserArtifacts
        : (userArtifactPort != null ? userArtifactPort.findAllByUserId(user.getId()) : List.of());

    Map<String, Artifact> artifactByAchCode = new HashMap<>();
    for (Artifact art : artifactCatalog) {
      if (art.getSourceType() == ArtifactSourceType.ACHIEVEMENT && art.getRequiredAchievementCode() != null) {
        artifactByAchCode.put(art.getRequiredAchievementCode().trim().toUpperCase(), art);
      }
    }

    int unlockedCount = 0;
    int totalPoints = 0;
    int maxPoints = 0;

    List<AchievementProgressItem> items = new ArrayList<>(catalog.size());
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

      Artifact grantedArtifact = artifactByAchCode.get(achievement.getCode().trim().toUpperCase());

      items.add(new AchievementProgressItem(
          achievement,
          isUnlocked,
          isUnlocked ? unlock.getUnlockedAt() : null,
          !isUnlocked || unlock.isSeen(),
          clampedCurrent,
          isUnlocked ? 100 : percent,
          grantedArtifact));
    }

    Map<UUID, UserArtifact> userArtifactMap = userArtifacts.stream()
        .collect(Collectors.toMap(UserArtifact::getArtifactId, Function.identity(), (a, b) -> a));

    int unlockedArtifactsCount = 0;
    List<ArtifactProgressItem> artifactItems = new ArrayList<>(artifactCatalog.size());
    for (Artifact artifact : artifactCatalog) {
      UserArtifact owned = userArtifactMap.get(artifact.getId());
      boolean ownedFlag = owned != null;
      if (ownedFlag) {
        unlockedArtifactsCount++;
      }
      artifactItems.add(new ArtifactProgressItem(
          artifact,
          ownedFlag,
          ownedFlag ? owned.getUnlockedAt() : null,
          ownedFlag ? owned.getObtainedSource() : null,
          !ownedFlag || owned.isSeen()));
    }

    return new UserShowcaseResult(
        user,
        effectiveStreakResolver.resolve(user),
        highlights,
        items,
        unlockedCount,
        catalog.size(),
        totalPoints,
        maxPoints,
        artifactItems,
        unlockedArtifactsCount,
        artifactCatalog.size());
  }
}
