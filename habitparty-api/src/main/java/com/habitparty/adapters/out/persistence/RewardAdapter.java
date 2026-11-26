package com.habitparty.adapters.out.persistence;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.entities.RewardJpaEntity;
import com.habitparty.adapters.out.persistence.mappers.RewardMapper;
import com.habitparty.adapters.out.persistence.repository.RewardJpaRepository;
import com.habitparty.application.ports.RewardRepository;
import com.habitparty.core.domain.entities.reward.Reward;

@Component
public class RewardAdapter implements RewardRepository {
  private final RewardJpaRepository rewardJpaRepository;
  private final RewardMapper rewardMapper;

  public RewardAdapter(RewardJpaRepository rewardJpaRepository, RewardMapper rewardMapper) {
    this.rewardJpaRepository = rewardJpaRepository;
    this.rewardMapper = rewardMapper;
  }

  @Override
  public Reward save(Reward reward) {
    RewardJpaEntity entity = rewardJpaRepository.findById(reward.getId())
        .map(existing -> {
          rewardMapper.updateEntityFromDomain(existing, reward);
          return existing;
        })
        .orElseGet(() -> rewardMapper.toEntity(reward));

    RewardJpaEntity savedEntity = rewardJpaRepository.save(entity);
    return rewardMapper.toDomain(savedEntity);
  }

  @Override
  public void deleteById(UUID id) {
    rewardJpaRepository.deleteById(id);
  }

  @Override
  public Optional<Reward> findById(UUID id) {
    return rewardJpaRepository.findById(id)
        .map(rewardMapper::toDomain);
  }

  @Override
  public Optional<List<Reward>> findAllByIds(Collection<UUID> ids) {
    if (ids == null || ids.isEmpty()) {
      return Optional.of(List.of());
    }
    return Optional.of(rewardJpaRepository.findAllById(ids).stream()
        .map(rewardMapper::toDomain)
        .toList());
  }

  @Override
  public Optional<Integer> deleteAllByIds(Collection<UUID> ids, UUID userId) {
    if (ids == null || ids.isEmpty() || userId == null) {
      return Optional.of(0);
    }
    return Optional.of(rewardJpaRepository.deleteAllByIdInAndUserId(ids, userId));
  }

  @Override
  public List<Reward> findAllByUserId(UUID userId) {
    List<RewardJpaEntity> entities = rewardJpaRepository.findByUserIdOrderByOrderIndexAsc(userId);
    return entities.stream()
        .map(rewardMapper::toDomain)
        .toList();
  }

  @Override
  public int countByUserId(UUID userId) {
    return rewardJpaRepository.countByUserId(userId);
  }

  @Override
  public List<Reward> saveAll(List<Reward> rewards) {
    if (rewards == null || rewards.isEmpty()) {
      return List.of();
    }
    List<UUID> ids = rewards.stream()
        .map(Reward::getId)
        .filter(Objects::nonNull)
        .toList();
    Map<UUID, RewardJpaEntity> existingById = rewardJpaRepository.findAllById(ids).stream()
        .collect(Collectors.toMap(RewardJpaEntity::getId, Function.identity(), (a, b) -> a));

    List<RewardJpaEntity> entities = new ArrayList<>(rewards.size());
    for (Reward reward : rewards) {
      RewardJpaEntity entity = existingById.get(reward.getId());
      if (entity != null) {
        rewardMapper.updateEntityFromDomain(entity, reward);
      } else {
        entity = rewardMapper.toEntity(reward);
      }
      entities.add(entity);
    }

    List<RewardJpaEntity> savedEntities = rewardJpaRepository.saveAll(entities);
    return savedEntities.stream()
        .map(rewardMapper::toDomain)
        .toList();
  }

  @Override
  public int getMaxOrderIndex(UUID userId) {
    return rewardJpaRepository.findMaxOrderIndexByUserId(userId);
  }

  @Override
  public void deleteAllByUserId(UUID userId) {
    rewardJpaRepository.deleteAllByUserId(userId);
  }
}
