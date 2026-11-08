package com.habitparty.application.usecases.achievement;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
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

@Service
public class EvaluateUserAchievementsUseCase {
  private final AchievementRepository achievementPort;
  private final UserAchievementRepository userAchievementPort;
  private final ProfileHighlightRepository profileHighlightPort;
  private final UserRepository userPort;

  public record EvaluationSnapshot(
      List<Achievement> catalog,
      List<UserAchievement> allUserUnlocks,
      List<Achievement> newlyUnlocked) {}

  public EvaluateUserAchievementsUseCase(
      AchievementRepository achievementPort,
      UserAchievementRepository userAchievementPort,
      ProfileHighlightRepository profileHighlightPort,
      UserRepository userPort) {
    this.achievementPort = achievementPort;
    this.userAchievementPort = userAchievementPort;
    this.profileHighlightPort = profileHighlightPort;
    this.userPort = userPort;
  }

  @Transactional
  public List<Achievement> execute(User user) {
    return executeWithSnapshot(user, null).newlyUnlocked();
  }

  @Transactional
  public EvaluationSnapshot executeWithSnapshot(User user, List<ProfileHighlight> preloadedHighlights) {
    if (user == null || user.getId() == null) {
      return new EvaluationSnapshot(List.of(), List.of(), List.of());
    }

    List<Achievement> catalog = achievementPort.findAllOrdered();
    if (catalog.isEmpty()) {
      return new EvaluationSnapshot(List.of(), List.of(), List.of());
    }

    List<UserAchievement> existingUnlocks = userAchievementPort.findAllByUserId(user.getId());
    Set<UUID> unlockedIds = existingUnlocks.stream()
        .map(UserAchievement::getAchievementId)
        .collect(Collectors.toSet());

    int highlightsCount = preloadedHighlights != null
        ? preloadedHighlights.size()
        : (int) profileHighlightPort.countByUserId(user.getId());

    List<UserAchievement> newlyUnlockedRecords = new ArrayList<>();
    List<Achievement> newlyUnlockedAchievements = new ArrayList<>();
    int totalPointsCalculated = 0;

    List<Achievement> deferredMetaAchievements = new ArrayList<>();

    for (Achievement achievement : catalog) {
      if (unlockedIds.contains(achievement.getId())) {
        totalPointsCalculated += achievement.getPoints();
        continue;
      }

      Optional<AchievementCode> codeOpt = AchievementCode.fromString(achievement.getCode());
      if (codeOpt.isEmpty()) {
        continue;
      }

      // Conquistas meta (ex: 1.000 Pontos de Conquista) são avaliadas após somar toda a rodada
      if (codeOpt.get().dependsOnAchievementPoints()) {
        deferredMetaAchievements.add(achievement);
        continue;
      }

      int currentProgress = codeOpt.get().extractCurrentProgress(user, highlightsCount);
      if (currentProgress >= achievement.getTargetValue()) {
        UserAchievement newUnlock = UserAchievement.createNewlyUnlocked(user.getId(), achievement.getId());
        newlyUnlockedRecords.add(newUnlock);
        newlyUnlockedAchievements.add(achievement);
        totalPointsCalculated += achievement.getPoints();
      }
    }

    // Segunda passada: usa a pontuação já consolidada desta rodada para as conquistas meta
    for (Achievement meta : deferredMetaAchievements) {
      if (totalPointsCalculated >= meta.getTargetValue()) {
        newlyUnlockedRecords.add(UserAchievement.createNewlyUnlocked(user.getId(), meta.getId()));
        newlyUnlockedAchievements.add(meta);
        totalPointsCalculated += meta.getPoints();
      }
    }

    List<UserAchievement> allUnlocks = existingUnlocks;
    if (!newlyUnlockedRecords.isEmpty()) {
      List<UserAchievement> savedNew = userAchievementPort.saveAll(newlyUnlockedRecords);
      allUnlocks = new ArrayList<>(existingUnlocks.size() + savedNew.size());
      allUnlocks.addAll(existingUnlocks);
      allUnlocks.addAll(savedNew.isEmpty() ? newlyUnlockedRecords : savedNew);
    }

    if (user.getStats() != null && user.getStats().getAchievementPoints() != totalPointsCalculated) {
      user.getStats().setAchievementPoints(totalPointsCalculated);
      userPort.save(user);
    }

    return new EvaluationSnapshot(catalog, allUnlocks, newlyUnlockedAchievements);
  }
}
