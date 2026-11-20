package com.habitparty.application.usecases.reward;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.RewardRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.reward.Reward;
import com.habitparty.core.domain.entities.reward.RewardGrouping;
import com.habitparty.core.domain.enums.RewardCategory;
import com.habitparty.core.domain.enums.RewardPackageLevel;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.LimitExceededException;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
@Transactional
public class UpdateRewardUseCase {
  private final RewardRepository port;
  private final UserRepository userPort;

  public UpdateRewardUseCase(RewardRepository port, UserRepository userPort) {
    this.port = port;
    this.userPort = userPort;
  }

  public Reward execute(UUID rewardId, UpdateRewardCommand command, UUID userIdLogado) {
    User user = userPort.findById(userIdLogado)
        .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado!"));

    List<Reward> userRewards = port.findAllByUserId(userIdLogado);
    Reward reward = userRewards.stream()
        .filter(r -> r.getId().equals(rewardId))
        .findFirst()
        .orElseGet(() -> {
          Reward other = port.findById(rewardId)
              .orElseThrow(() -> new ResourceNotFoundException("Recompensa não encontrada!"));
          other.validateOwnership(userIdLogado);
          return other;
        });

    int previousGroupCount = RewardGrouping.countDistinctGroups(userRewards);
    String previousGroupKey = RewardGrouping.groupKey(reward);
    RewardPackageLevel previousPackageLevel = reward.getPackageLevel().orElse(RewardPackageLevel.NONE);

    reward.updateDetails(
        command.name(), command.description(), command.price(), command.icon(),
        command.category(), command.tags(), command.type(),
        command.packageLevel(), command.baseDurationMinutes(),
        command.lootItems());

    int newGroupCount = RewardGrouping.countDistinctGroups(userRewards);
    int maxCards = RewardGrouping.getMaxRewardCards(user.isPremium());
    if (newGroupCount > previousGroupCount && newGroupCount > maxCards) {
      throw new LimitExceededException(user.isPremium()
          ? "Limite de " + RewardGrouping.PREMIUM_MAX_REWARD_CARDS
              + " cards de recompensa por usuário atingido no plano premium."
          : "Limite de " + RewardGrouping.FREE_MAX_REWARD_CARDS
              + " cards de recompensa por usuário atingido no plano gratuito.");
    }

    String newGroupKey = RewardGrouping.groupKey(reward);
    RewardCategory updatedCategory = reward.getCategory().orElse(RewardCategory.NONE);
    RewardPackageLevel updatedPackageLevel = reward.getPackageLevel().orElse(RewardPackageLevel.NONE);
    if (RewardGrouping.isGroupable(reward.getType(), updatedCategory)) {
      if (!newGroupKey.equals(previousGroupKey)) {
        int targetGroupVariants = RewardGrouping.countGroupVariants(userRewards, newGroupKey);
        if (targetGroupVariants > RewardGrouping.MAX_VARIANTS_PER_GROUP) {
          throw new LimitExceededException(
              "Este card já atingiu o limite máximo de "
                  + RewardGrouping.MAX_VARIANTS_PER_GROUP
                  + " pacotes.");
        }
      }
      if ((!newGroupKey.equals(previousGroupKey) || updatedPackageLevel != previousPackageLevel)
          && RewardGrouping.findConflictingPackageTier(
                  userRewards, newGroupKey, updatedPackageLevel, reward.getId())
              .isPresent()) {
        throw new DomainValidationException(
            "Este card já possui um pacote de nível "
                + RewardGrouping.formatPackageLevelLabel(updatedPackageLevel)
                + ". Escolha outro nível.");
      }
    }

    return port.save(reward);
  }
}
