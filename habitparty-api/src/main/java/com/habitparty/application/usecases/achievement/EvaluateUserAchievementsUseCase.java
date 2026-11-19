package com.habitparty.application.usecases.achievement;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
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
import com.habitparty.application.usecases.social.NotifyFriendsMilestoneUseCase;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.achievement.Achievement;
import com.habitparty.core.domain.entities.achievement.Artifact;
import com.habitparty.core.domain.entities.achievement.ProfileHighlight;
import com.habitparty.core.domain.entities.achievement.UserAchievement;
import com.habitparty.core.domain.entities.achievement.UserArtifact;
import com.habitparty.core.domain.enums.AchievementCode;
import com.habitparty.core.domain.enums.ArtifactSourceType;
import com.habitparty.core.domain.enums.UserLevel;

@Service
public class EvaluateUserAchievementsUseCase {
  private final AchievementRepository achievementPort;
  private final UserAchievementRepository userAchievementPort;
  private final ProfileHighlightRepository profileHighlightPort;
  private final UserRepository userPort;
  private final NotifyFriendsMilestoneUseCase socialMilestoneNotifier;
  private final ArtifactRepository artifactPort;
  private final UserArtifactRepository userArtifactPort;

  public record EvaluationSnapshot(
      List<Achievement> catalog,
      List<UserAchievement> allUserUnlocks,
      List<Achievement> newlyUnlocked,
      List<Artifact> newlyUnlockedArtifacts,
      @Nullable List<Artifact> artifactCatalog,
      @Nullable List<UserArtifact> userArtifacts) {
    public EvaluationSnapshot(
        List<Achievement> catalog,
        List<UserAchievement> allUserUnlocks,
        List<Achievement> newlyUnlocked) {
      this(catalog, allUserUnlocks, newlyUnlocked, List.of(), null, null);
    }

    public EvaluationSnapshot(
        List<Achievement> catalog,
        List<UserAchievement> allUserUnlocks,
        List<Achievement> newlyUnlocked,
        List<Artifact> newlyUnlockedArtifacts) {
      this(catalog, allUserUnlocks, newlyUnlocked, newlyUnlockedArtifacts, null, null);
    }
  }

  private record ArtifactGrantResult(
      List<Artifact> newlyGranted,
      @Nullable List<Artifact> artifactCatalog,
      @Nullable List<UserArtifact> userArtifacts) {
    private static ArtifactGrantResult notLoaded(List<Artifact> newlyGranted) {
      return new ArtifactGrantResult(newlyGranted, null, null);
    }
  }

  @Autowired
  public EvaluateUserAchievementsUseCase(
      AchievementRepository achievementPort,
      UserAchievementRepository userAchievementPort,
      ProfileHighlightRepository profileHighlightPort,
      UserRepository userPort,
      @Nullable NotifyFriendsMilestoneUseCase socialMilestoneNotifier,
      @Nullable ArtifactRepository artifactPort,
      @Nullable UserArtifactRepository userArtifactPort) {
    this.achievementPort = achievementPort;
    this.userAchievementPort = userAchievementPort;
    this.profileHighlightPort = profileHighlightPort;
    this.userPort = userPort;
    this.socialMilestoneNotifier = socialMilestoneNotifier;
    this.artifactPort = artifactPort;
    this.userArtifactPort = userArtifactPort;
  }

  public EvaluateUserAchievementsUseCase(
      AchievementRepository achievementPort,
      UserAchievementRepository userAchievementPort,
      ProfileHighlightRepository profileHighlightPort,
      UserRepository userPort,
      @Nullable NotifyFriendsMilestoneUseCase socialMilestoneNotifier) {
    this(achievementPort, userAchievementPort, profileHighlightPort, userPort, socialMilestoneNotifier, null, null);
  }

  public EvaluateUserAchievementsUseCase(
      AchievementRepository achievementPort,
      UserAchievementRepository userAchievementPort,
      ProfileHighlightRepository profileHighlightPort,
      UserRepository userPort) {
    this(achievementPort, userAchievementPort, profileHighlightPort, userPort, null, null, null);
  }

  @Transactional
  public List<Achievement> execute(User user) {
    return executeWithSnapshot(user, null).newlyUnlocked();
  }

  @Transactional
  public List<Achievement> executeForUserId(UUID userId) {
    if (userId == null) {
      return List.of();
    }
    return userPort.findById(userId)
        .map(this::execute)
        .orElseGet(List::of);
  }

  @Transactional
  public void notifyLevelMilestoneIfReached(UUID userId, UserLevel reachedLevel) {
    if (socialMilestoneNotifier != null && userId != null && reachedLevel != null) {
      socialMilestoneNotifier.notifyLevelMilestone(userId, reachedLevel);
    }
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

      if (socialMilestoneNotifier != null) {
        for (Achievement unlocked : newlyUnlockedAchievements) {
          socialMilestoneNotifier.notifyAchievementUnlocked(user.getId(), unlocked);
        }
      }
    }

    if (user.getStats() != null && user.getStats().getAchievementPoints() != totalPointsCalculated) {
      user.getStats().setAchievementPoints(totalPointsCalculated);
      userPort.save(user);
    }

    ArtifactGrantResult artifactGrant = grantEligibleAchievementArtifacts(user.getId(), catalog, allUnlocks);

    return new EvaluationSnapshot(
        catalog,
        allUnlocks,
        newlyUnlockedAchievements,
        artifactGrant.newlyGranted(),
        artifactGrant.artifactCatalog(),
        artifactGrant.userArtifacts());
  }

  private ArtifactGrantResult grantEligibleAchievementArtifacts(
      UUID userId,
      List<Achievement> catalog,
      List<UserAchievement> allUnlocks) {
    if (artifactPort == null || userArtifactPort == null || allUnlocks == null || allUnlocks.isEmpty()) {
      return ArtifactGrantResult.notLoaded(List.of());
    }

    List<Artifact> artifactCatalog = artifactPort.findAllOrdered();
    if (artifactCatalog.isEmpty()) {
      return new ArtifactGrantResult(List.of(), List.of(), List.of());
    }

    Set<UUID> unlockedAchievementIds = allUnlocks.stream()
        .map(UserAchievement::getAchievementId)
        .collect(Collectors.toSet());
    Set<String> unlockedCodes = catalog.stream()
        .filter(a -> unlockedAchievementIds.contains(a.getId()))
        .map(a -> a.getCode().trim().toUpperCase())
        .collect(Collectors.toSet());

    if (unlockedCodes.isEmpty()) {
      return new ArtifactGrantResult(List.of(), artifactCatalog, null);
    }

    List<UserArtifact> existingArtifacts = userArtifactPort.findAllByUserId(userId);
    Set<UUID> ownedArtifactIds = existingArtifacts.stream()
        .map(UserArtifact::getArtifactId)
        .collect(Collectors.toSet());

    List<UserArtifact> toCreate = new ArrayList<>();
    List<Artifact> granted = new ArrayList<>();
    for (Artifact artifact : artifactCatalog) {
      if (artifact.getSourceType() != ArtifactSourceType.ACHIEVEMENT
          || artifact.getRequiredAchievementCode() == null) {
        continue;
      }
      if (!ownedArtifactIds.contains(artifact.getId())
          && unlockedCodes.contains(artifact.getRequiredAchievementCode())) {
        toCreate.add(UserArtifact.createNewlyUnlocked(userId, artifact.getId(), "ACHIEVEMENT"));
        granted.add(artifact);
      }
    }

    if (!toCreate.isEmpty()) {
      userArtifactPort.saveAll(toCreate);
      List<UserArtifact> combinedArtifacts = new ArrayList<>(existingArtifacts.size() + toCreate.size());
      combinedArtifacts.addAll(existingArtifacts);
      combinedArtifacts.addAll(toCreate);
      return new ArtifactGrantResult(granted, artifactCatalog, List.copyOf(combinedArtifacts));
    }

    return new ArtifactGrantResult(granted, artifactCatalog, existingArtifacts);
  }
}
