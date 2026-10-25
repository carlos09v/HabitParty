package com.habitparty.adapters.out.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

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
    // 1. O JpaRepository vai no banco e traz a lista de entidades ordenadas por orderIndex
    List<RewardJpaEntity> entities = rewardJpaRepository.findByUser_IdOrderByOrderIndexAsc(userId);

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
  public List<Reward> saveAll(List<Reward> rewards) {
      List<RewardJpaEntity> entities = rewards.stream()
          .map(rewardMapper::toEntity)
          .toList();

      // SALVA NO BANCO DE DADOS EM LOTE
      List<RewardJpaEntity> savedEntities = rewardJpaRepository.saveAll(entities);

      // Converte as entidades salvas de volta para o Domínio
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
