package com.habitparty.application.usecases.reward;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.habitparty.adapters.in.web.dtos.request.UpdateRewardDTO;
import com.habitparty.application.ports.RewardRepository;
import com.habitparty.core.domain.entities.Reward;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class UpdateRewardUseCase {
  private final RewardRepository port;

  public UpdateRewardUseCase(RewardRepository port) {
    this.port = port;
  }

  public Reward execute(UUID rewardId, UpdateRewardDTO dto, UUID userIdLogado) {
    Reward reward = port.findById(rewardId)
      .orElseThrow(() -> new ResourceNotFoundException("Recompensa não encontrada!"));
    reward.validateOwnership(userIdLogado);
    
    // 3. Atualiza apenas o que foi recebido do frontend
    if (dto.name() != null) {
      reward.updateName(dto.name());
    }
    
    if (dto.icon() != null) {
      reward.updateIcon(dto.icon());
    }
    
    if (dto.description() != null) {
      reward.updateDescription(dto.description());
    }
    
    if (dto.price() != null) {
      reward.updatePrice(dto.price());
    }
    
    if (dto.category() != null) {
      reward.updateCategory(dto.category());
    }
    
    if (dto.tags() != null) {
      reward.updateTags(dto.tags());
    }
    
    if (dto.type() != null) {
      reward.updateType(dto.type());
    }
    
    if (dto.packageLevel() != null) {
      reward.updatePackageLevel(dto.packageLevel());
    }
    
    if (dto.baseDurationMinutes() != null) {
      reward.updateBaseDurationMinutes(dto.baseDurationMinutes());
    }

    return port.save(reward);
  }
}
