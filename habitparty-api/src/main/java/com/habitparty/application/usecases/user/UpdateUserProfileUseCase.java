package com.habitparty.application.usecases.user;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.usecases.user.EffectiveStreakResolver.UserWithEffectiveStreak;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
@Transactional
public class UpdateUserProfileUseCase {
  private final UserRepository port;
  private final EffectiveStreakResolver effectiveStreakResolver;

  @Autowired
  public UpdateUserProfileUseCase(
      UserRepository port,
      EffectiveStreakResolver effectiveStreakResolver) {
    this.port = port;
    this.effectiveStreakResolver = effectiveStreakResolver != null
        ? effectiveStreakResolver
        : new EffectiveStreakResolver(null);
  }

  public UpdateUserProfileUseCase(UserRepository port) {
    this(port, new EffectiveStreakResolver(null));
  }

  public User execute(UUID userIdLogado, UpdateUserProfileCommand command) {
    User user = port.findById(userIdLogado)
        .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

    user.updateProfile(
        command.fullName() != null ? command.fullName() : user.getFullName(),
        command.birthDate() != null ? command.birthDate() : user.getBirthDate(),
        command.gender() != null ? command.gender() : user.getGender()
    );

    if (command.experienceMode() != null) {
      user.updateExperienceMode(command.experienceMode());
    }

    return port.save(user);
  }

  public UserWithEffectiveStreak executeWithEffectiveStreak(
      UUID userIdLogado, UpdateUserProfileCommand command) {
    return effectiveStreakResolver.wrap(execute(userIdLogado, command));
  }
}
