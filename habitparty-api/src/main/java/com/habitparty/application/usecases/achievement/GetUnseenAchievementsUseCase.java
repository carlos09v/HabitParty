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
import com.habitparty.application.ports.UserAchievementRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.achievement.Achievement;
import com.habitparty.core.domain.entities.achievement.UserAchievement;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class GetUnseenAchievementsUseCase {
  private final UserRepository userPort;
  private final AchievementRepository achievementPort;
  private final UserAchievementRepository userAchievementPort;
  private final EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase;

  public GetUnseenAchievementsUseCase(
      UserRepository userPort,
      AchievementRepository achievementPort,
      UserAchievementRepository userAchievementPort,
      EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase) {
    this.userPort = userPort;
    this.achievementPort = achievementPort;
    this.userAchievementPort = userAchievementPort;
    this.evaluateUserAchievementsUseCase = evaluateUserAchievementsUseCase;
  }

  public record UnseenAchievementItem(Achievement achievement, LocalDateTime unlockedAt) {}

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

    return unseen.stream()
        .filter(ua -> catalogMap.containsKey(ua.getAchievementId()))
        .map(ua -> new UnseenAchievementItem(catalogMap.get(ua.getAchievementId()), ua.getUnlockedAt()))
        .toList();
  }
}
