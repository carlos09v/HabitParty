package com.habitparty.application.usecases.achievement;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.usecases.user.EffectiveStreakResolver;
import com.habitparty.application.usecases.user.EffectiveStreakResolver.UserWithEffectiveStreak;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class UpdateShowcaseProfileUseCase {
  private final UserRepository userPort;
  private final EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase;
  private final EffectiveStreakResolver effectiveStreakResolver;

  @Autowired
  public UpdateShowcaseProfileUseCase(
      UserRepository userPort,
      EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase,
      EffectiveStreakResolver effectiveStreakResolver) {
    this.userPort = userPort;
    this.evaluateUserAchievementsUseCase = evaluateUserAchievementsUseCase;
    this.effectiveStreakResolver = effectiveStreakResolver != null
        ? effectiveStreakResolver
        : new EffectiveStreakResolver(null);
  }

  public UpdateShowcaseProfileUseCase(
      UserRepository userPort,
      EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase) {
    this(userPort, evaluateUserAchievementsUseCase, new EffectiveStreakResolver(null));
  }

  public record UpdateShowcaseProfileCommand(String bio, String avatarFrame) {}

  @Transactional
  public User execute(UUID userId, UpdateShowcaseProfileCommand command) {
    User user = userPort.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

    user.updateShowcaseProfile(command.bio(), command.avatarFrame());
    User saved = userPort.save(user);
    evaluateUserAchievementsUseCase.execute(saved);
    return saved;
  }

  @Transactional
  public UserWithEffectiveStreak executeWithEffectiveStreak(
      UUID userId, UpdateShowcaseProfileCommand command) {
    return effectiveStreakResolver.wrap(execute(userId, command));
  }
}
