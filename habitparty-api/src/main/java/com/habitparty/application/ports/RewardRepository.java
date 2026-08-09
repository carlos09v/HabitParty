package com.habitparty.application.ports;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.habitparty.core.domain.entities.Reward;

public interface RewardRepository {
  Reward save(Reward reward);
  void deleteById(UUID id);
  List<Reward> findAllByUserId(UUID userId);
  Optional<Reward> findById(UUID id);
  void reorderAll(List<Reward> rewards);

  int countByUserId(UUID userId); //  Contagem para validação do limite de 25 rewards por user (plano free)

  // Falta o update
}
