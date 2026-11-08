package com.habitparty.application.usecases.achievement;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class UpdateShowcaseProfileUseCase {
  private final UserRepository userPort;
  private final EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase;

  public UpdateShowcaseProfileUseCase(
      UserRepository userPort,
      EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase) {
    this.userPort = userPort;
    this.evaluateUserAchievementsUseCase = evaluateUserAchievementsUseCase;
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
}
