package com.habitparty.application.usecases.user;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.habitparty.adapters.in.web.dtos.request.UpdateUserPasswordDTO;
import com.habitparty.application.ports.PasswordHasherPort;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class UpdateUserPasswordUseCase {
  private final UserRepository port;
  private final PasswordHasherPort passwordHasher;

  public UpdateUserPasswordUseCase(UserRepository port, PasswordHasherPort passwordHasher) {
    this.port = port;
    this.passwordHasher = passwordHasher;
  }

  public void execute(UUID userId, UpdateUserPasswordDTO dto) {
    User user = port.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

    // 1. Verifica se a senha atual informada bate com o hash do banco
    if (!passwordHasher.matches(dto.currentPassword(), user.getPassword())) {
      throw new DomainValidationException("A senha atual está incorreta.");
    }

    // 2. Cria o Hash da nova senha
    String newHash = passwordHasher.encode(dto.newPassword());

    // 3. Atualiza no domínio e salva
    user.updatePassword(newHash);
    port.save(user);
  }
}
