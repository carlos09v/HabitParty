package com.habitparty.application.usecases.reward;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.habitparty.adapters.in.web.dtos.request.UpdateRewardDTO;
import com.habitparty.adapters.in.web.dtos.response.RewardResponseDTO;
import com.habitparty.application.ports.RewardRepository;
import com.habitparty.core.domain.entities.reward.Reward;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class UpdateRewardUseCase {
  private final RewardRepository port;

  public UpdateRewardUseCase(RewardRepository port) {
    this.port = port;
  }

  public RewardResponseDTO execute(UUID rewardId, UpdateRewardDTO dto, UUID userIdLogado) {
    Reward reward = port.findById(rewardId)
        .orElseThrow(() -> new ResourceNotFoundException("Recompensa não encontrada!"));
    reward.validateOwnership(userIdLogado);

    reward.updateDetails(
        dto.name(), dto.description(), dto.price(), dto.icon(),
        dto.category(), dto.tags(), dto.type(),
        dto.packageLevel(), dto.baseDurationMinutes());

    Reward savedReward = port.save(reward);

    return RewardResponseDTO.fromDomain(savedReward);
  }
}
