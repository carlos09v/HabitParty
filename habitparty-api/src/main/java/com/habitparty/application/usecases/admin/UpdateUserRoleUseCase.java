package com.habitparty.application.usecases.admin;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.RefreshTokenRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.enums.UserRole;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
@Transactional
public class UpdateUserRoleUseCase {

  private final UserRepository userPort;
  private final RefreshTokenRepository refreshTokenRepository;

  public UpdateUserRoleUseCase(UserRepository userPort) {
    this(userPort, null);
  }

  @Autowired
  public UpdateUserRoleUseCase(
      UserRepository userPort,
      @Nullable RefreshTokenRepository refreshTokenRepository) {
    this.userPort = userPort;
    this.refreshTokenRepository = refreshTokenRepository;
  }

  public User execute(UUID targetUserId, UUID currentAdminId, UserRole newRole) {
    if (targetUserId == null) {
      throw new DomainValidationException("O usuário alvo deve ser informado.");
    }
    if (newRole == null) {
      throw new DomainValidationException("A role deve ser informada.");
    }

    if (targetUserId.equals(currentAdminId) && newRole != UserRole.ADMIN) {
      throw new DomainValidationException("Você não pode remover o seu próprio privilégio de Administrador.");
    }

    User targetUser = userPort.findByIdForUpdate(targetUserId)
        .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

    UserRole previousRole = targetUser.getRole();
    if (previousRole == UserRole.ADMIN && newRole != UserRole.ADMIN) {
      long adminCount = userPort.countByRole(UserRole.ADMIN);
      if (adminCount <= 1) {
        throw new DomainValidationException("Não é possível remover o privilégio do último Administrador do sistema.");
      }
    }

    targetUser.setRole(newRole);
    User saved = userPort.save(targetUser);

    if (previousRole != newRole && refreshTokenRepository != null) {
      refreshTokenRepository.revokeAllByUserId(targetUserId);
    }

    return saved;
  }
}
