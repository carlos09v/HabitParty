package com.habitparty.adapters.out.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.mappers.AchievementMapper;
import com.habitparty.adapters.out.persistence.repository.AchievementJpaRepository;
import com.habitparty.application.ports.AchievementRepository;
import com.habitparty.core.domain.entities.achievement.Achievement;

@Component
public class AchievementAdapter implements AchievementRepository {
  private final AchievementJpaRepository repository;
  private final AchievementMapper mapper;

  public AchievementAdapter(AchievementJpaRepository repository, AchievementMapper mapper) {
    this.repository = repository;
    this.mapper = mapper;
  }

  @Override
  public List<Achievement> findAllOrdered() {
    return repository.findAllByOrderByDisplayOrderAsc().stream()
        .map(mapper::toDomain)
        .toList();
  }

  @Override
  public Optional<Achievement> findById(UUID id) {
    return repository.findById(id).map(mapper::toDomain);
  }

  @Override
  public Optional<Achievement> findByCode(String code) {
    return repository.findByCode(code).map(mapper::toDomain);
  }
}
