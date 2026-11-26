package com.habitparty.application.usecases.reward;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
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

    List<Reward> reorderedRegulars = reorderRegularRewards(regularRewards, regularMap, debts.size(), newOrderList);

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

  private List<Reward> reorderRegularRewards(
      List<Reward> regularRewards,
      Map<UUID, Reward> regularMap,
      int debtCount,
      List<RewardOrderCommand> newOrderList) {
    int regularCount = regularRewards.size();
    if (regularCount <= 1 || newOrderList == null || newOrderList.isEmpty()) {
      return new ArrayList<>(regularRewards);
    }

    Map<UUID, Integer> originalPositionById = new HashMap<>(regularCount);
    for (int i = 0; i < regularCount; i++) {
      originalPositionById.put(regularRewards.get(i).getId(), i);
    }

    // Deduplica comandos válidos mantendo o último índice informado para cada recompensa regular
    Map<UUID, Integer> targetIndexById = new LinkedHashMap<>();
    for (RewardOrderCommand cmd : newOrderList) {
      if (cmd != null && cmd.id() != null && regularMap.containsKey(cmd.id())) {
        targetIndexById.put(cmd.id(), cmd.newIndex());
      }
    }

    if (targetIndexById.isEmpty()) {
      return new ArrayList<>(regularRewards);
    }

    // Payload completo das recompensas regulares: ordenação direta pelo índice solicitado
    if (targetIndexById.size() == regularCount) {
      return targetIndexById.entrySet().stream()
          .sorted(Comparator
              .<Map.Entry<UUID, Integer>>comparingInt(Map.Entry::getValue)
              .thenComparingInt(entry -> originalPositionById.getOrDefault(entry.getKey(), Integer.MAX_VALUE)))
          .map(entry -> regularMap.get(entry.getKey()))
          .collect(Collectors.toCollection(() -> new ArrayList<>(regularCount)));
    }

    // Payload parcial: posiciona os itens informados nos slots alvo e preenche os demais
    // preservando a ordem relativa das recompensas não enviadas no payload
    Reward[] slots = new Reward[regularCount];
    List<Map.Entry<UUID, Integer>> sortedTargets = targetIndexById.entrySet().stream()
        .sorted(Comparator
            .<Map.Entry<UUID, Integer>>comparingInt(Map.Entry::getValue)
            .thenComparingInt(entry -> originalPositionById.getOrDefault(entry.getKey(), Integer.MAX_VALUE)))
        .toList();

    for (Map.Entry<UUID, Integer> entry : sortedTargets) {
      int requestedSlot = Math.max(0, Math.min(regularCount - 1, entry.getValue() - debtCount));
      int chosenSlot = findNearestAvailableSlot(slots, requestedSlot);
      if (chosenSlot >= 0) {
        slots[chosenSlot] = regularMap.get(entry.getKey());
      }
    }

    int nextSlot = 0;
    for (Reward regular : regularRewards) {
      if (!targetIndexById.containsKey(regular.getId())) {
        while (nextSlot < regularCount && slots[nextSlot] != null) {
          nextSlot++;
        }
        if (nextSlot < regularCount) {
          slots[nextSlot] = regular;
        }
      }
    }

    List<Reward> result = new ArrayList<>(regularCount);
    for (Reward slot : slots) {
      if (slot != null) {
        result.add(slot);
      }
    }
    return result;
  }

  private int findNearestAvailableSlot(Reward[] slots, int preferredSlot) {
    if (slots[preferredSlot] == null) {
      return preferredSlot;
    }
    for (int i = preferredSlot + 1; i < slots.length; i++) {
      if (slots[i] == null) {
        return i;
      }
    }
    for (int i = preferredSlot - 1; i >= 0; i--) {
      if (slots[i] == null) {
        return i;
      }
    }
    return -1;
  }
}
