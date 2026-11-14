package com.habitparty.application.usecases.social;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.usecases.user.EffectiveStreakResolver;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class UpdatePrivacySettingsUseCase {

  private final UserRepository userRepository;
  private final EffectiveStreakResolver effectiveStreakResolver;

  public UpdatePrivacySettingsUseCase(
      UserRepository userRepository,
      EffectiveStreakResolver effectiveStreakResolver) {
    this.userRepository = userRepository;
    this.effectiveStreakResolver = effectiveStreakResolver;
  }

  @Transactional
  public EffectiveStreakResolver.UserWithEffectiveStreak execute(UUID userId, UpdatePrivacySettingsCommand command) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

    user.updatePrivacySettings(
        command.profileVisibility(),
        command.statsVisibility(),
        command.achievementsVisibility(),
        command.friendRequestPolicy());

    User saved = userRepository.save(user);
    return effectiveStreakResolver.wrap(saved);
  }
}
