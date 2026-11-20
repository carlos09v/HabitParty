package com.habitparty.application.usecases.reward;

import java.util.LinkedHashSet;
import java.util.List;
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
    for (UUID rewardId : uniqueIds) {
      Reward reward = rewardPort.findById(rewardId)
          .orElseThrow(() -> new ResourceNotFoundException("Recompensa não encontrada!"));
      reward.validateOwnership(userIdLogado);
    }

    for (UUID rewardId : uniqueIds) {
      if (transactionPort.existsByReferenceIdAndUserId(rewardId, userIdLogado)) {
        return true;
      }
    }
    return false;
  }
}
