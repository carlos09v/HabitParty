package com.habitparty.application.usecases.inventory;

import java.math.BigDecimal;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.InventoryItemRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.usecases.achievement.EvaluateUserAchievementsUseCase;
import com.habitparty.core.domain.entities.InventoryItem;
import com.habitparty.core.domain.entities.TransactionHistory;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.reward.MysteryBoxLootTable;
import com.habitparty.core.domain.entities.reward.MysteryBoxResult;
import com.habitparty.core.domain.enums.InventoryItemStatus;
import com.habitparty.core.domain.enums.RewardPackageLevel;
import com.habitparty.core.domain.enums.RewardType;
import com.habitparty.core.domain.enums.TransactionType;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class OpenMysteryBoxUseCase {
  private final InventoryItemRepository port;
  private final TransactionHistoryRepository transactionHistoryRepositoryPort;
  private UserRepository userPort;
  private EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase;

  public OpenMysteryBoxUseCase(InventoryItemRepository port,
      TransactionHistoryRepository transactionHistoryRepositoryPort) {
    this.port = port;
    this.transactionHistoryRepositoryPort = transactionHistoryRepositoryPort;
  }

  @Autowired(required = false)
  public void setUserPort(UserRepository userPort) {
    this.userPort = userPort;
  }

  @Autowired(required = false)
  public void setEvaluateUserAchievementsUseCase(EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase) {
    this.evaluateUserAchievementsUseCase = evaluateUserAchievementsUseCase;
  }

  @Transactional
  public InventoryItem execute(UUID itemId, UUID userIdLogado) {
    InventoryItem item = port.findById(itemId)
        .orElseThrow(() -> new ResourceNotFoundException("Item não encontrado"));
    item.validateOwnership(userIdLogado);

    if (item.getStatus() != InventoryItemStatus.AVAILABLE) {
      throw new DomainValidationException("Apenas caixas disponíveis podem ser abertas.");
    }

    if (item.getRewardTypeSnapshot() != RewardType.MISTERY_BOX) {
      throw new DomainValidationException("Este item não é uma caixa misteriosa.");
    }

    RewardPackageLevel level = item.getPackageLevelSnapshot().orElse(RewardPackageLevel.BASIC);
    MysteryBoxResult result = MysteryBoxLootTable.roll(level, item.getLootItemsSnapshot());

    item.setNameSnapshot(result.name());
    item.setIconSnapshot(result.icon());
    item.setPackageLevelSnapshot(level);
    item.setLootItemsSnapshot(null);

    if (result.minutes() != null && result.minutes() > 0) {
      item.setRewardTypeSnapshot(RewardType.TIME_BASED);
      item.setRemainingSeconds(result.minutes() * 60);
    } else {
      item.setRewardTypeSnapshot(RewardType.SINGLE_USE);
      item.setRemainingSeconds(null);
    }

    port.save(item);

    TransactionHistory transaction = new TransactionHistory(
        null,
        userIdLogado,
        item.getId(),
        BigDecimal.ZERO,
        0,
        item.getPriceSnapshot(),
        TransactionType.ITEM_CONSUMED,
        "Caixa Aberta: " + result.name(),
        result.icon(),
        level,
        null,
        null,
        null);

    transactionHistoryRepositoryPort.save(transaction);

    if (userPort != null) {
      userPort.findById(userIdLogado).ifPresent((User user) -> {
        if (user.getStats() != null) {
          user.getStats().recordMysteryBoxOpened();
        }
        userPort.save(user);
        if (evaluateUserAchievementsUseCase != null) {
          evaluateUserAchievementsUseCase.execute(user);
        }
      });
    }

    return item;
  }
}
