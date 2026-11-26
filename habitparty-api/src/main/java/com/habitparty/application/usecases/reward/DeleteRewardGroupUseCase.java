package com.habitparty.application.usecases.reward;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.RewardRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.core.domain.entities.reward.Reward;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
@Transactional
public class DeleteRewardGroupUseCase {
  private final RewardRepository port;
  private final TransactionHistoryRepository transactionPort;

  public DeleteRewardGroupUseCase(
      RewardRepository port,
      TransactionHistoryRepository transactionPort) {
    this.port = port;
    this.transactionPort = transactionPort;
  }

  public void execute(List<UUID> rewardIds, UUID userIdLogado, boolean deleteHistory) {
    if (rewardIds == null || rewardIds.isEmpty()) {
      throw new DomainValidationException("Informe ao menos uma recompensa para excluir.");
    }
    Set<UUID> uniqueIds = new LinkedHashSet<>(rewardIds);
    Map<UUID, Reward> rewardsById = loadRewardsByIds(uniqueIds);

    for (UUID rewardId : uniqueIds) {
      Reward reward = rewardsById.get(rewardId);
      if (reward == null) {
        throw new ResourceNotFoundException("Recompensa não encontrada!");
      }
      reward.validateOwnership(userIdLogado);
    }

    List<UUID> idList = new ArrayList<>(uniqueIds);
    if (deleteHistory) {
      transactionPort.deleteAllByReferenceIdsAndUserId(idList, userIdLogado);
    }

    if (port.deleteAllByIds(idList, userIdLogado).isEmpty()) {
      for (UUID rewardId : uniqueIds) {
        port.deleteById(rewardId);
      }
    }
  }

  private Map<UUID, Reward> loadRewardsByIds(Set<UUID> rewardIds) {
    Map<UUID, Reward> map = new HashMap<>(rewardIds.size());
    port.findAllByIds(rewardIds).ifPresentOrElse(
        rewards -> {
          for (Reward reward : rewards) {
            if (reward != null && reward.getId() != null) {
              map.put(reward.getId(), reward);
            }
          }
        },
        () -> {
          for (UUID rewardId : rewardIds) {
            port.findById(rewardId).ifPresent(reward -> map.put(rewardId, reward));
          }
        });
    return map;
  }
}
