package com.habitparty.adapters.out.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.entities.RewardJpaEntity;
import com.habitparty.adapters.out.persistence.mappers.RewardMapper;
import com.habitparty.adapters.out.persistence.repository.RewardJpaRepository;
import com.habitparty.application.ports.RewardRepository;
import com.habitparty.core.domain.entities.Reward;

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
    RewardJpaEntity entity = rewardMapper.toEntity(reward);

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
        .map(entity -> rewardMapper.toDomain(entity));
  }

  @Override
  public List<Reward> findAllByUserId(UUID userId) {
    // 1. O JpaRepository vai no banco e traz a lista de entidades
    List<RewardJpaEntity> entities = rewardJpaRepository.findByUser_Id(userId);

    // 2. Converte a lista de entidades JPA para lista de Domínio
    return entities.stream()
        .map(entity -> rewardMapper.toDomain(entity))
        .toList();
  }

  @Override
  public int countByUserId(UUID userId) {
    return rewardJpaRepository.countByUser_Id(userId);
  }

  @Override
  public void reorderAll(List<Reward> rewards) {
    // 1. Recebe o Domínio puro, converte cada item da lista para Entidade JPA
    List<RewardJpaEntity> entities = rewards.stream()
        .map(domain -> rewardMapper.toEntity(domain))
        .toList();

    rewardJpaRepository.saveAll(entities);
  }
}
