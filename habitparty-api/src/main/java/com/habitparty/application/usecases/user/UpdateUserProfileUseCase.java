package com.habitparty.application.usecases.user;

import java.time.Clock;
import java.time.ZoneId;
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
  private final Clock clock;
  private com.habitparty.application.usecases.task.DailyResetUseCase dailyResetUseCase;

  @Autowired
  public UpdateUserProfileUseCase(
      UserRepository port,
      EffectiveStreakResolver effectiveStreakResolver,
      Clock clock) {
    this.port = port;
    this.effectiveStreakResolver = effectiveStreakResolver != null
        ? effectiveStreakResolver
        : new EffectiveStreakResolver(null);
    this.clock = clock != null ? clock : Clock.system(ZoneId.of(User.DEFAULT_TIMEZONE));
  }

  @Autowired(required = false)
  public void setDailyResetUseCase(com.habitparty.application.usecases.task.DailyResetUseCase dailyResetUseCase) {
    this.dailyResetUseCase = dailyResetUseCase;
  }

  public UpdateUserProfileUseCase(
      UserRepository port,
      EffectiveStreakResolver effectiveStreakResolver) {
    this(port, effectiveStreakResolver, Clock.system(ZoneId.of(User.DEFAULT_TIMEZONE)));
  }

  public UpdateUserProfileUseCase(UserRepository port) {
    this(port, new EffectiveStreakResolver(null), Clock.system(ZoneId.of(User.DEFAULT_TIMEZONE)));
  }

  private User findUserOrThrow(UUID userIdLogado) {
    return port.findById(userIdLogado)
        .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));
  }

  public User execute(UUID userIdLogado, UpdateUserProfileCommand command) {
    if (dailyResetUseCase != null) {
      dailyResetUseCase.resetUserIfDue(userIdLogado);
    }
    User user = findUserOrThrow(userIdLogado);

    if (command.timezone() != null && !command.timezone().isBlank()) {
      user.changeTimezone(command.timezone(), clock);
    }

    user.updateProfile(
        command.fullName() != null ? command.fullName() : user.getFullName(),
        command.birthDate() != null ? command.birthDate() : user.getBirthDate(),
        command.gender() != null ? command.gender() : user.getGender(),
        user.resolveLocalDate(clock)
    );

    if (command.experienceMode() != null) {
      user.updateExperienceMode(command.experienceMode());
    }

    if (command.theme() != null && !command.theme().isBlank()) {
      user.updateTheme(command.theme());
    }

    return port.save(user);
  }

  public UserWithEffectiveStreak executeWithEffectiveStreak(
      UUID userIdLogado, UpdateUserProfileCommand command) {
    return effectiveStreakResolver.wrap(execute(userIdLogado, command));
  }

  public User updateTheme(UUID userIdLogado, String theme) {
    User user = findUserOrThrow(userIdLogado);
    user.updateTheme(theme);
    return port.save(user);
  }

  public UserWithEffectiveStreak updateThemeWithEffectiveStreak(UUID userIdLogado, String theme) {
    return effectiveStreakResolver.wrap(updateTheme(userIdLogado, theme));
  }
}
