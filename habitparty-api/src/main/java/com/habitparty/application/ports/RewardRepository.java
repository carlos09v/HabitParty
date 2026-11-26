package com.habitparty.application.ports;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.habitparty.core.domain.entities.reward.Reward;

public interface RewardRepository {
  Reward save(Reward reward);
  void deleteById(UUID id);
  List<Reward> findAllByUserId(UUID userId);
  Optional<Reward> findById(UUID id);
  List<Reward> saveAll(List<Reward> rewards);

  default Optional<List<Reward>> findAllByIds(Collection<UUID> ids) {
    return Optional.empty();
  }

  default Optional<Integer> deleteAllByIds(Collection<UUID> ids, UUID userId) {
    return Optional.empty();
  }

  int countByUserId(UUID userId); // Contagem bruta de registros de recompensa por usuário

  // Para a criação da coluna gerar o index a partir do ultimo gerado
  int getMaxOrderIndex(UUID userId);

  void deleteAllByUserId(UUID userId);
}
