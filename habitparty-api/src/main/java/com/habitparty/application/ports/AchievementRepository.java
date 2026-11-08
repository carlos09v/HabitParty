package com.habitparty.application.ports;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.habitparty.core.domain.entities.achievement.Achievement;

public interface AchievementRepository {
  List<Achievement> findAllOrdered();
  Optional<Achievement> findById(UUID id);
  Optional<Achievement> findByCode(String code);
}
