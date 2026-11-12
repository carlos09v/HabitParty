package com.habitparty.application.usecases.reward;

import java.util.UUID;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.stereotype.Service;

import com.habitparty.application.ports.RewardRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.core.domain.entities.reward.Reward;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
@Transactional
public class DeleteRewardUseCase {
  private final RewardRepository port;
  private final TransactionHistoryRepository transactionPort;

  public DeleteRewardUseCase(RewardRepository port, TransactionHistoryRepository transactionPort) {
    this.port = port;
    this.transactionPort = transactionPort;
  }

  public void execute(UUID rewardId, UUID userIdLogado) {
    execute(rewardId, userIdLogado, false);
  }

  /**
   * @param deleteHistory quando verdadeiro, remove também os registros de compra (REWARD_BOUGHT)
   *                      desta recompensa no Histórico.
   */
  public void execute(UUID rewardId, UUID userIdLogado, boolean deleteHistory) {
    Reward reward = port.findById(rewardId)
        .orElseThrow(() -> new ResourceNotFoundException("Recompensa não encontrada!"));

    reward.validateOwnership(userIdLogado);

    if (deleteHistory) {
      transactionPort.deleteAllByReferenceIdAndUserId(rewardId, userIdLogado);
    }

    port.deleteById(rewardId);
  }
}
