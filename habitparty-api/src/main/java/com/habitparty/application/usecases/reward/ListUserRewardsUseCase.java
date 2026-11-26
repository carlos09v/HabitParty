package com.habitparty.application.usecases.reward;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.RewardRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.reward.Reward;
import com.habitparty.core.domain.entities.reward.RewardGrouping;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
@Transactional(readOnly = true)
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

    return RewardGrouping.sortWithDebtsFirst(port.findAllByUserId(userIdLogado));
  }
}
