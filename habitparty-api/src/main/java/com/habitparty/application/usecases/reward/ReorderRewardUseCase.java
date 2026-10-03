package com.habitparty.application.usecases.reward;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.adapters.in.web.dtos.request.UpdateRewardOrderDTO;
import com.habitparty.application.ports.RewardRepository;
import com.habitparty.core.domain.entities.reward.Reward;

@Service
public class ReorderRewardUseCase {
  private final RewardRepository port;

  public ReorderRewardUseCase(RewardRepository port) {
    this.port = port;
  }

  @Transactional
  public void execute(List<UpdateRewardOrderDTO> newOrderList, UUID userIdLogado) {
    List<Reward> rewards = port.findAllByUserId(userIdLogado);

    // Transforma em um Map para busca instantânea pelo ID
    Map<UUID, Reward> mapaRecompensas = rewards.stream()
        .collect(Collectors.toMap(Reward::getId, r -> r));

    List<Reward> updatedRewards = new ArrayList<>();

    for (UpdateRewardOrderDTO dto : newOrderList) {
      Reward reward = mapaRecompensas.get(dto.id());

      if (reward != null) { // Evita NullPointer caso o front mande um ID que não existe
        reward.updateOrderIndex(dto.newIndex());
        updatedRewards.add(reward);
      }
    }

    port.saveAll(updatedRewards);
  }
}
