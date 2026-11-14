package com.habitparty.application.usecases.social;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.usecases.user.EffectiveStreakResolver;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class RegenerateFriendCodeUseCase {

  private final UserRepository userRepository;
  private final EffectiveStreakResolver effectiveStreakResolver;

  public RegenerateFriendCodeUseCase(
      UserRepository userRepository,
      EffectiveStreakResolver effectiveStreakResolver) {
    this.userRepository = userRepository;
    this.effectiveStreakResolver = effectiveStreakResolver;
  }

  @Transactional
  public EffectiveStreakResolver.UserWithEffectiveStreak execute(UUID userId) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

    String previousCode = user.getFriendCode();
    String candidate = User.generateRandomFriendCode();
    for (int attempt = 0; attempt < 15; attempt++) {
      String generated = User.generateRandomFriendCode();
      if (!generated.equalsIgnoreCase(previousCode) && !userRepository.existsByFriendCode(generated)) {
        candidate = generated;
        break;
      }
    }

    user.setFriendCode(candidate);
    User saved = userRepository.save(user);
    return effectiveStreakResolver.wrap(saved);
  }
}
