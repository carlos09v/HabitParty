package com.habitparty.application.usecases.user;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.habitparty.adapters.in.web.dtos.request.UpdateUserDTO;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class UpdateUserProfileUseCase {
  private final UserRepository port;

  public UpdateUserProfileUseCase(UserRepository port) {
    this.port = port;
  }

  public User execute(UUID userIdLogado, UpdateUserDTO dto) {
    User user = port.findById(userIdLogado)
        .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

    user.updateProfile(
        dto.fullName() != null ? dto.fullName() : user.getFullName(),
        dto.birthday() != null ? dto.birthday() : user.getBirthday(),
        dto.gender() != null ? dto.gender() : user.getGender()
    );

    return port.save(user);
  }
}
