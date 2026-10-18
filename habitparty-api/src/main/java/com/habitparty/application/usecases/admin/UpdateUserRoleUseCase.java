package com.habitparty.application.usecases.admin;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.enums.UserRole;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
@Transactional
public class UpdateUserRoleUseCase {

  private final UserRepository userPort;

  public UpdateUserRoleUseCase(UserRepository userPort) {
    this.userPort = userPort;
  }

  public User execute(UUID targetUserId, UUID currentAdminId, UserRole newRole) {
    if (newRole == null) {
      throw new DomainValidationException("A role deve ser informada.");
    }

    if (targetUserId.equals(currentAdminId) && newRole != UserRole.ADMIN) {
      throw new DomainValidationException("Você não pode remover o seu próprio privilégio de Administrador.");
    }

    User targetUser = userPort.findById(targetUserId)
        .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

    targetUser.setRole(newRole);

    return userPort.save(targetUser);
  }
}
