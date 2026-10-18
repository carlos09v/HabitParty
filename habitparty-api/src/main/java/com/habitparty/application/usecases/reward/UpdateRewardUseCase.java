package com.habitparty.application.usecases.reward;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.RewardRepository;
import com.habitparty.core.domain.entities.reward.Reward;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
@Transactional
public class UpdateRewardUseCase {
  private final RewardRepository port;

  public UpdateRewardUseCase(RewardRepository port) {
    this.port = port;
  }

  public Reward execute(UUID rewardId, UpdateRewardCommand command, UUID userIdLogado) {
    Reward reward = port.findById(rewardId)
        .orElseThrow(() -> new ResourceNotFoundException("Recompensa não encontrada!"));
    reward.validateOwnership(userIdLogado);

    reward.updateDetails(
        command.name(), command.description(), command.price(), command.icon(),
        command.category(), command.tags(), command.type(),
        command.packageLevel(), command.baseDurationMinutes());

    return port.save(reward);
  }
}
