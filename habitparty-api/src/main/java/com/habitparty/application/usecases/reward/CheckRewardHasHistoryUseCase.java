package com.habitparty.application.usecases.reward;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.RewardRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.core.domain.entities.reward.Reward;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
@Transactional(readOnly = true)
public class CheckRewardHasHistoryUseCase {
  private final RewardRepository rewardPort;
  private final TransactionHistoryRepository transactionPort;

  public CheckRewardHasHistoryUseCase(
      RewardRepository rewardPort,
      TransactionHistoryRepository transactionPort) {
    this.rewardPort = rewardPort;
    this.transactionPort = transactionPort;
  }

  public boolean execute(UUID rewardId, UUID userIdLogado) {
    Reward reward = rewardPort.findById(rewardId)
        .orElseThrow(() -> new ResourceNotFoundException("Recompensa não encontrada!"));

    reward.validateOwnership(userIdLogado);

    return transactionPort.existsByReferenceIdAndUserId(rewardId, userIdLogado);
  }
}
