package com.habitparty.application.usecases.reward;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.RewardRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.User;
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
public class UpdateRewardGroupUseCase {
  private final RewardRepository port;
  private final UserRepository userPort;
  private final TransactionHistoryRepository transactionPort;

  public UpdateRewardGroupUseCase(
      RewardRepository port,
      UserRepository userPort,
      TransactionHistoryRepository transactionPort) {
    this.port = port;
    this.userPort = userPort;
    this.transactionPort = transactionPort;
  }

  public List<Reward> execute(UpdateRewardGroupCommand command, UUID userIdLogado) {
    if (command.sourceRewardIds() == null || command.sourceRewardIds().isEmpty()) {
      throw new DomainValidationException("Informe ao menos uma recompensa de origem.");
    }
    if (command.variants() == null || command.variants().isEmpty()) {
      throw new DomainValidationException("O card deve possuir ao menos um pacote.");
    }
    if (command.variants().size() > RewardGrouping.MAX_VARIANTS_PER_GROUP) {
      throw new LimitExceededException(
          "Um card pode ter no máximo " + RewardGrouping.MAX_VARIANTS_PER_GROUP + " pacotes.");
    }

    User user = userPort.findById(userIdLogado)
        .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado!"));

    List<Reward> userRewards = port.findAllByUserId(userIdLogado);
    Map<UUID, Reward> userRewardsById = new HashMap<>();
    for (Reward existing : userRewards) {
      userRewardsById.put(existing.getId(), existing);
    }

    Set<UUID> sourceIdSet = new LinkedHashSet<>(command.sourceRewardIds());
    List<Reward> sourceRewards = new ArrayList<>();
    for (UUID sourceId : sourceIdSet) {
      Reward found = userRewardsById.get(sourceId);
      if (found == null) {
        Reward foreign = port.findById(sourceId)
            .orElseThrow(() -> new ResourceNotFoundException("Recompensa não encontrada!"));
        foreign.validateOwnership(userIdLogado);
        found = foreign;
      }
      sourceRewards.add(found);
    }

    RewardType groupType = sourceRewards.get(0).getType();
    if (groupType == RewardType.MISTERY_BOX) {
      throw new DomainValidationException("Caixas misteriosas não podem ser editadas em grupo.");
    }
    for (Reward src : sourceRewards) {
      if (src.getType() != groupType) {
        throw new DomainValidationException("Todas as recompensas do grupo devem ter o mesmo tipo.");
      }
      if (src.getCategory().orElse(RewardCategory.NONE) == RewardCategory.DEBT) {
        throw new DomainValidationException("Recompensas de dívida não podem ser agrupadas.");
      }
    }

    RewardCategory targetCategory = command.category() != null
        ? command.category()
        : sourceRewards.get(0).getCategory().orElse(RewardCategory.NONE);
    if (targetCategory == RewardCategory.DEBT) {
      throw new DomainValidationException("Um card agrupado não pode ser convertido para Dívida.");
    }
    Reward.validateCategoryAndType(targetCategory, groupType);

    String sanitizedDescription = command.description() != null ? command.description().trim() : null;
    String sanitizedIcon = command.icon() != null && !command.icon().trim().isEmpty()
        ? command.icon().trim()
        : sourceRewards.get(0).getIcon().orElse(null);

    Set<UUID> seenVariantIds = new HashSet<>();
    int nextOrderIndex = Math.max(
        port.getMaxOrderIndex(userIdLogado),
        userRewards.stream().mapToInt(Reward::getOrder_index).max().orElse(-1));

    List<Reward> resultingGroupRewards = new ArrayList<>();
    for (UpdateRewardGroupCommand.VariantItem variant : command.variants()) {
      if (variant.name() == null || variant.name().trim().isEmpty()) {
        throw new DomainValidationException("O nome do pacote é obrigatório.");
      }
      Reward.validatePrice(variant.price());
      RewardPackageLevel pkgLevel = variant.packageLevel() != null
          ? variant.packageLevel()
          : RewardPackageLevel.NONE;
      Integer durationMinutes = null;
      if (groupType == RewardType.TIME_BASED) {
        if (variant.baseDurationMinutes() != null && variant.baseDurationMinutes() <= 0) {
          throw new DomainValidationException("A duração do cupom deve ser maior que zero.");
        }
        durationMinutes = variant.baseDurationMinutes() != null ? variant.baseDurationMinutes() : 30;
      }

      if (variant.id() != null) {
        if (!sourceIdSet.contains(variant.id())) {
          throw new DomainValidationException("Pacote informado não pertence ao grupo editado.");
        }
        if (!seenVariantIds.add(variant.id())) {
          throw new DomainValidationException("Pacote duplicado na atualização do grupo.");
        }
        Reward target = userRewardsById.get(variant.id());
        target.updateDetails(
            variant.name().trim(),
            sanitizedDescription,
            variant.price(),
            sanitizedIcon,
            targetCategory,
            command.tags(),
            groupType,
            pkgLevel,
            durationMinutes,
            null);
        resultingGroupRewards.add(target);
      } else {
        nextOrderIndex += 1;
        Reward created = new Reward(
            UUID.randomUUID(),
            userIdLogado,
            variant.name().trim(),
            variant.price(),
            command.tags() != null ? command.tags() : List.of(),
            groupType,
            nextOrderIndex,
            sanitizedIcon,
            sanitizedDescription,
            targetCategory,
            durationMinutes,
            pkgLevel,
            null);
        resultingGroupRewards.add(created);
      }
    }

    // Simula a vitrine final para garantir limites de cards (sem dívidas) e teto de 4 variantes por card
    int previousGroupCount = RewardGrouping.countRegularDistinctGroups(userRewards);
    int previousDebtCount = RewardGrouping.countActiveDebts(userRewards);
    List<Reward> simulatedFinalRewards = new ArrayList<>();
    for (Reward existing : userRewards) {
      if (!sourceIdSet.contains(existing.getId())) {
        simulatedFinalRewards.add(existing);
      }
    }
    simulatedFinalRewards.addAll(resultingGroupRewards);

    int newGroupCount = RewardGrouping.countRegularDistinctGroups(simulatedFinalRewards);
    int newDebtCount = RewardGrouping.countActiveDebts(simulatedFinalRewards);
    if (newDebtCount > previousDebtCount && newDebtCount > RewardGrouping.MAX_ACTIVE_DEBTS) {
      throw new LimitExceededException(
          "Limite máximo de " + RewardGrouping.MAX_ACTIVE_DEBTS
              + " dívidas ativas atingido. Quite uma dívida antes de registrar outra.");
    }
    int maxCards = RewardGrouping.getMaxRewardCards(user.isPremium());
    if (newGroupCount > previousGroupCount && newGroupCount > maxCards) {
      throw new LimitExceededException(user.isPremium()
          ? "Limite de " + RewardGrouping.PREMIUM_MAX_REWARD_CARDS
              + " cards de recompensa por usuário atingido no plano premium."
          : "Limite de " + RewardGrouping.FREE_MAX_REWARD_CARDS
              + " cards de recompensa por usuário atingido no plano gratuito.");
    }

    for (Reward resultItem : resultingGroupRewards) {
      String groupKey = RewardGrouping.groupKey(resultItem);
      if (RewardGrouping.countGroupVariants(simulatedFinalRewards, groupKey)
          > RewardGrouping.MAX_VARIANTS_PER_GROUP) {
        throw new LimitExceededException(
            "Este card já atingiu o limite máximo de "
                + RewardGrouping.MAX_VARIANTS_PER_GROUP
                + " pacotes.");
      }
      RewardPackageLevel pkg = resultItem.getPackageLevel().orElse(RewardPackageLevel.NONE);
      if (RewardGrouping.findConflictingPackageTier(
              simulatedFinalRewards, groupKey, pkg, resultItem.getId())
          .isPresent()) {
        throw new DomainValidationException(
            "Cada card pode ter apenas um pacote de nível "
                + RewardGrouping.formatPackageLevelLabel(pkg)
                + ".");
      }
    }

    List<UUID> removedIds = new ArrayList<>();
    for (UUID sourceId : sourceIdSet) {
      if (!seenVariantIds.contains(sourceId)) {
        removedIds.add(sourceId);
      }
    }

    if (!removedIds.isEmpty()) {
      if (command.deleteRemovedHistory()) {
        transactionPort.deleteAllByReferenceIdsAndUserId(removedIds, userIdLogado);
      }
      for (UUID removedId : removedIds) {
        port.deleteById(removedId);
      }
    }

    return port.saveAll(resultingGroupRewards);
  }
}
