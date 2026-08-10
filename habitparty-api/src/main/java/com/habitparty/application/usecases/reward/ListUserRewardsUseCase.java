package com.habitparty.application.usecases.reward;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.habitparty.application.ports.RewardRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.Reward;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class ListUserRewardsUseCase {
  private final RewardRepository port;
  private final UserRepository userPort;

  public ListUserRewardsUseCase(RewardRepository port, UserRepository userPort) {
    this.port = port;
    this.userPort = userPort;
  }

  public List<Reward> execute(UUID userIdLogado) {
    userPort.findById(userIdLogado)
      .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado!")); 

       return port.findAllByUserId(userIdLogado);
  }
}
