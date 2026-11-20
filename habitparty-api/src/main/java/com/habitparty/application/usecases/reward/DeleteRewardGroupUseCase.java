package com.habitparty.application.usecases.reward;

import java.util.ArrayList;
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
    for (UUID rewardId : uniqueIds) {
      Reward reward = port.findById(rewardId)
          .orElseThrow(() -> new ResourceNotFoundException("Recompensa não encontrada!"));
      reward.validateOwnership(userIdLogado);
    }

    if (deleteHistory) {
      transactionPort.deleteAllByReferenceIdsAndUserId(new ArrayList<>(uniqueIds), userIdLogado);
    }

    for (UUID rewardId : uniqueIds) {
      port.deleteById(rewardId);
    }
  }
}
