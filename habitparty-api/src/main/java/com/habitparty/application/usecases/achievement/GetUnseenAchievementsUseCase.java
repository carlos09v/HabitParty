package com.habitparty.application.usecases.achievement;

import java.time.LocalDateTime;
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
import com.habitparty.application.ports.UserAchievementRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.achievement.Achievement;
import com.habitparty.core.domain.entities.achievement.Artifact;
import com.habitparty.core.domain.entities.achievement.UserAchievement;
import com.habitparty.core.domain.enums.ArtifactSourceType;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class GetUnseenAchievementsUseCase {
  private final UserRepository userPort;
  private final AchievementRepository achievementPort;
  private final UserAchievementRepository userAchievementPort;
  private final EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase;
  private final ArtifactRepository artifactPort;

  @Autowired
  public GetUnseenAchievementsUseCase(
      UserRepository userPort,
      AchievementRepository achievementPort,
      UserAchievementRepository userAchievementPort,
      EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase,
      @Nullable ArtifactRepository artifactPort) {
    this.userPort = userPort;
    this.achievementPort = achievementPort;
    this.userAchievementPort = userAchievementPort;
    this.evaluateUserAchievementsUseCase = evaluateUserAchievementsUseCase;
    this.artifactPort = artifactPort;
  }

  public GetUnseenAchievementsUseCase(
      UserRepository userPort,
      AchievementRepository achievementPort,
      UserAchievementRepository userAchievementPort,
      EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase) {
    this(userPort, achievementPort, userAchievementPort, evaluateUserAchievementsUseCase, null);
  }

  public record UnseenAchievementItem(
      Achievement achievement,
      LocalDateTime unlockedAt,
      @Nullable Artifact grantedArtifact) {
    public UnseenAchievementItem(Achievement achievement, LocalDateTime unlockedAt) {
      this(achievement, unlockedAt, null);
    }
  }

  @Transactional
  public List<UnseenAchievementItem> execute(UUID userId) {
    User user = userPort.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

    var snapshot = evaluateUserAchievementsUseCase.executeWithSnapshot(user, null);

    List<UserAchievement> unseen = userAchievementPort.findUnseenByUserId(userId);
    if (unseen.isEmpty()) {
      return List.of();
    }

    List<Achievement> catalog = !snapshot.catalog().isEmpty()
        ? snapshot.catalog()
        : achievementPort.findAllOrdered();
    Map<UUID, Achievement> catalogMap = catalog.stream()
        .collect(Collectors.toMap(Achievement::getId, Function.identity()));

    List<Artifact> artifactCatalog = snapshot.artifactCatalog() != null
        ? snapshot.artifactCatalog()
        : (artifactPort != null ? artifactPort.findAllOrdered() : List.of());

    Map<String, Artifact> artifactByAchCode = new HashMap<>();
    for (Artifact art : artifactCatalog) {
      if (art.getSourceType() == ArtifactSourceType.ACHIEVEMENT && art.getRequiredAchievementCode() != null) {
        artifactByAchCode.put(art.getRequiredAchievementCode().trim().toUpperCase(), art);
      }
    }

    return unseen.stream()
        .filter(ua -> catalogMap.containsKey(ua.getAchievementId()))
        .map(ua -> {
          Achievement ach = catalogMap.get(ua.getAchievementId());
          Artifact granted = artifactByAchCode.get(ach.getCode().trim().toUpperCase());
          return new UnseenAchievementItem(ach, ua.getUnlockedAt(), granted);
        })
        .toList();
  }
}
