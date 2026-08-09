package com.habitparty.application.usecases.reward;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.habitparty.application.ports.RewardRepository;
import com.habitparty.core.domain.entities.Reward;
import com.habitparty.core.exceptions.RewardNotFoundExeption;

@Service
public class DeleteRewardUseCase {
  private final RewardRepository port;

  public DeleteRewardUseCase(RewardRepository port) {
    this.port = port;
  }

  public void execute(UUID rewardId, UUID userIdLogado) {
    Reward reward = port.findById(rewardId)
        .orElseThrow(() -> new RewardNotFoundExeption("Recompensa não encontrada!"));

    reward.validateOwnership(userIdLogado);

    port.deleteById(rewardId);
  }
}
