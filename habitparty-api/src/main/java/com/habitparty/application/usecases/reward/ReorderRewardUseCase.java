package com.habitparty.application.usecases.reward;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.RewardRepository;
import com.habitparty.core.domain.entities.reward.Reward;
import com.habitparty.core.domain.entities.reward.RewardGrouping;

@Service
public class ReorderRewardUseCase {
  private final RewardRepository port;

  public ReorderRewardUseCase(RewardRepository port) {
    this.port = port;
  }

  @Transactional
  public void execute(UUID userIdLogado, List<RewardOrderCommand> newOrderList) {
    List<Reward> rewards = RewardGrouping.sortWithDebtsFirst(port.findAllByUserId(userIdLogado));
    if (rewards.isEmpty()) {
      return;
    }

    // Dívidas permanecem fixadas primeiro no topo e não podem ser reordenadas pelo usuário
    List<Reward> debts = new ArrayList<>();
    List<Reward> regularRewards = new ArrayList<>();
    for (Reward reward : rewards) {
      if (RewardGrouping.isDebt(reward)) {
        debts.add(reward);
      } else {
        regularRewards.add(reward);
      }
    }

    Map<UUID, Reward> regularMap = regularRewards.stream()
        .collect(Collectors.toMap(Reward::getId, r -> r));

    List<Reward> reorderedRegulars = new ArrayList<>();
    Set<UUID> seenRegularIds = new HashSet<>();

    if (newOrderList != null) {
      List<RewardOrderCommand> sortedCommands = newOrderList.stream()
          .sorted(Comparator.comparingInt(RewardOrderCommand::newIndex))
          .toList();

      for (RewardOrderCommand cmd : sortedCommands) {
        Reward regular = regularMap.get(cmd.id());
        if (regular != null && seenRegularIds.add(regular.getId())) {
          reorderedRegulars.add(regular);
        }
      }
    }

    // Preserva quaisquer recompensas regulares não citadas no payload após as reordenadas
    for (Reward regular : regularRewards) {
      if (seenRegularIds.add(regular.getId())) {
        reorderedRegulars.add(regular);
      }
    }

    List<Reward> canonicalOrder = new ArrayList<>(rewards.size());
    canonicalOrder.addAll(debts);
    canonicalOrder.addAll(reorderedRegulars);

    List<Reward> updatedRewards = new ArrayList<>();
    for (int i = 0; i < canonicalOrder.size(); i++) {
      Reward reward = canonicalOrder.get(i);
      if (reward.getOrder_index() != i) { // Evita UPDATE desnecessário quando índice não mudou
        reward.updateOrderIndex(i);
        updatedRewards.add(reward);
      }
    }

    if (!updatedRewards.isEmpty()) {
      port.saveAll(updatedRewards);
    }
  }
}
