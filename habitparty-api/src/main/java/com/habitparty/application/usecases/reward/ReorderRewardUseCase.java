package com.habitparty.application.usecases.reward;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.habitparty.adapters.in.web.dtos.request.UpdateRewardOrderDTO;
import com.habitparty.application.ports.RewardRepository;
import com.habitparty.core.domain.entities.Reward;

@Service
public class ReorderRewardUseCase {
  private final RewardRepository port;

  public ReorderRewardUseCase(RewardRepository port) {
    this.port = port;
  }

  public void execute(List<UpdateRewardOrderDTO> newOrderList, UUID userIdLogado) {
    List<Reward> rewards = port.findAllByUserId(userIdLogado);

    for (Reward reward : rewards) {
      newOrderList.stream()
          .filter(dto -> dto.reward_id().equals(reward.getId()))
          .findFirst()
          .ifPresent(dto -> reward.setOrder_index(dto.newIndex()));
    }

    port.reorderAll(rewards);
  }
}
