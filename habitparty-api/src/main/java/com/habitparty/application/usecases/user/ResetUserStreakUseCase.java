package com.habitparty.application.usecases.user;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class ResetUserStreakUseCase {

  private final UserRepository port;

  public ResetUserStreakUseCase(UserRepository port) {
    this.port = port;
  }

  public void execute(UUID userId) {
    User user = port.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

    user.resetStreak();

    port.save(user);
  }
}