package com.habitparty.application.usecases.reward;

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
@Transactional(readOnly = true)
public class CheckRewardGroupHasHistoryUseCase {
  private final RewardRepository rewardPort;
  private final TransactionHistoryRepository transactionPort;

  public CheckRewardGroupHasHistoryUseCase(
      RewardRepository rewardPort,
      TransactionHistoryRepository transactionPort) {
    this.rewardPort = rewardPort;
    this.transactionPort = transactionPort;
  }

  public boolean execute(List<UUID> rewardIds, UUID userIdLogado) {
    if (rewardIds == null || rewardIds.isEmpty()) {
      throw new DomainValidationException("Informe ao menos uma recompensa para verificação.");
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

    return transactionPort.existsAnyByReferenceIdsAndUserId(uniqueIds, userIdLogado)
        .orElseGet(() -> {
          for (UUID rewardId : uniqueIds) {
            if (transactionPort.existsByReferenceIdAndUserId(rewardId, userIdLogado)) {
              return true;
            }
          }
          return false;
        });
  }

  private Map<UUID, Reward> loadRewardsByIds(Set<UUID> rewardIds) {
    Map<UUID, Reward> map = new HashMap<>(rewardIds.size());
    rewardPort.findAllByIds(rewardIds).ifPresentOrElse(
        rewards -> {
          for (Reward reward : rewards) {
            if (reward != null && reward.getId() != null) {
              map.put(reward.getId(), reward);
            }
          }
        },
        () -> {
          for (UUID rewardId : rewardIds) {
            rewardPort.findById(rewardId).ifPresent(reward -> map.put(rewardId, reward));
          }
        });
    return map;
  }
}
