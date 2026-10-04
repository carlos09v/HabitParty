package com.habitparty.application.usecases.user;

import java.util.UUID;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.stereotype.Service;

import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
@Transactional
public class AddUserXpUseCase {
  private final UserRepository port;

  public AddUserXpUseCase(UserRepository port) {
    this.port = port;
  }

  public void execute(UUID userId, int xpToAdd) {
    User user = port.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));
    
    // O método de domínio addXp() vai somar e calcular se o level upou!
    user.addXp(xpToAdd); 
    
    port.save(user);
  }
}
