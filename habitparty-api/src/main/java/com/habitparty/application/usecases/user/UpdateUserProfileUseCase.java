package com.habitparty.application.usecases.user;

import java.util.UUID;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.stereotype.Service;

import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
@Transactional
public class UpdateUserProfileUseCase {
  private final UserRepository port;

  public UpdateUserProfileUseCase(UserRepository port) {
    this.port = port;
  }

  public User execute(UUID userIdLogado, UpdateUserProfileCommand command) {
    User user = port.findById(userIdLogado)
        .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

    user.updateProfile(
        command.fullName() != null ? command.fullName() : user.getFullName(),
        command.birthday() != null ? command.birthday() : user.getBirthday(),
        command.gender() != null ? command.gender() : user.getGender()
    );

    return port.save(user);
  }
}
