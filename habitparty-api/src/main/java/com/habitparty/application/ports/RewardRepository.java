package com.habitparty.application.ports;

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

  int countByUserId(UUID userId); //  Contagem para validação do limite de 25 rewards por user (plano free)

  // Para a criação da coluna gerar o index a partir do ultimo gerado
  int getMaxOrderIndex(UUID userId);

  void deleteAllByUserId(UUID userId);
}
