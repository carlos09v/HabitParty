package com.habitparty.application.usecases.reward;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.RewardRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.reward.MysteryBoxLootItem;
import com.habitparty.core.domain.entities.reward.MysteryBoxLootTable;
import com.habitparty.core.domain.entities.reward.Reward;
import com.habitparty.core.domain.entities.reward.RewardGrouping;
import com.habitparty.core.domain.enums.RewardCategory;
import com.habitparty.core.domain.enums.RewardPackageLevel;
import com.habitparty.core.domain.enums.RewardType;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.LimitExceededException;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
@Transactional
public class CreateRewardUseCase {
  private final RewardRepository port;
  private final UserRepository userPort;

  public CreateRewardUseCase(RewardRepository port, UserRepository userPort) {
    this.port = port;
    this.userPort = userPort;
  }

  public Reward execute(CreateRewardCommand command, UUID userIdLogado) {
    User user = userPort.findById(userIdLogado)
        .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado!"));

    // 1. Regra de Preço, Tipo e Categoria
    Reward.validatePrice(command.price());
    RewardCategory categoriaFinal = command.category() != null ? command.category() : RewardCategory.NONE;
    Reward.validateCategoryAndType(categoriaFinal, command.type());

    // 2. Dívidas possuem cota implícita independente; cards regulares respeitam 12 Free / 50 Premium (+ até 4 pacotes)
    List<Reward> existingRewards = port.findAllByUserId(userIdLogado);
    boolean groupable = RewardGrouping.isGroupable(command.type(), categoriaFinal);
    String candidateGroupKey = groupable
        ? RewardGrouping.groupKey(null, command.name(), command.type(), categoriaFinal)
        : null;
    int existingVariantsInGroup = candidateGroupKey != null
        ? RewardGrouping.countGroupVariants(existingRewards, candidateGroupKey)
        : 0;

    if (categoriaFinal == RewardCategory.DEBT) {
      int activeDebts = RewardGrouping.countActiveDebts(existingRewards);
      if (activeDebts >= RewardGrouping.MAX_ACTIVE_DEBTS) {
        throw new LimitExceededException(
            "Limite máximo de " + RewardGrouping.MAX_ACTIVE_DEBTS
                + " dívidas ativas atingido. Quite uma dívida antes de registrar outra.");
      }
    } else {
      int maxCards = RewardGrouping.getMaxRewardCards(user.isPremium());
      if (existingVariantsInGroup > 0) {
        if (existingVariantsInGroup >= RewardGrouping.MAX_VARIANTS_PER_GROUP) {
          throw new LimitExceededException(
              "Este card já atingiu o limite máximo de "
                  + RewardGrouping.MAX_VARIANTS_PER_GROUP
                  + " pacotes.");
        }
      } else {
        int currentCards = RewardGrouping.countRegularDistinctGroups(existingRewards);
        if (currentCards >= maxCards) {
          throw new LimitExceededException(user.isPremium()
              ? "Limite de " + RewardGrouping.PREMIUM_MAX_REWARD_CARDS
                  + " cards de recompensa por usuário atingido no plano premium."
              : "Limite de " + RewardGrouping.FREE_MAX_REWARD_CARDS
                  + " cards de recompensa por usuário atingido no plano gratuito.");
        }
      }
    }

    int maxIndex = port.getMaxOrderIndex(user.getId());
    int newIndex = maxIndex + 1;

    Integer durationFinal = command.baseDurationMinutes();
    RewardPackageLevel packageFinal = command.packageLevel();
    List<MysteryBoxLootItem> lootItemsFinal = null;

    if (command.type() == RewardType.SINGLE_USE) {
      durationFinal = null;
      if (categoriaFinal == RewardCategory.DEBT || packageFinal == null) {
        packageFinal = RewardPackageLevel.NONE;
      }
    } else if (command.type() == RewardType.TIME_BASED) {
      if (durationFinal == null || durationFinal <= 0) {
        durationFinal = 30;
      }
      if (packageFinal == null) {
        packageFinal = RewardPackageLevel.NONE;
      }
    } else if (command.type() == RewardType.MISTERY_BOX) {
      durationFinal = null;
      if (packageFinal == null || packageFinal == RewardPackageLevel.NONE) {
        throw new DomainValidationException("Precisa ter um nível de pacote selecionado!");
      }
      lootItemsFinal = MysteryBoxLootTable.validateAndNormalizeLootItems(
          packageFinal,
          command.lootItems());
    }

    if (candidateGroupKey != null
        && existingVariantsInGroup > 0
        && RewardGrouping.findConflictingPackageTier(
                existingRewards, candidateGroupKey, packageFinal, null)
            .isPresent()) {
      throw new DomainValidationException(
          "Este card já possui um pacote de nível "
              + RewardGrouping.formatPackageLevelLabel(packageFinal)
              + ". Escolha outro nível.");
    }

    Reward newReward = new Reward(
        UUID.randomUUID(),
        userIdLogado,
        command.name(),
        command.price(),
        command.tags(),
        command.type(),
        newIndex,
        command.icon(),
        command.description(),
        categoriaFinal,
        durationFinal,
        packageFinal,
        lootItemsFinal);

    return port.save(newReward);
  }
}
