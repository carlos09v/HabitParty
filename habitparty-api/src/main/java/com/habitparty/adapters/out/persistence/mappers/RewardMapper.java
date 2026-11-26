package com.habitparty.adapters.out.persistence.mappers;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.entities.RewardJpaEntity;
import com.habitparty.core.domain.entities.reward.Reward;

@Component
public class RewardMapper {

  public RewardJpaEntity toEntity(Reward domain) {
    return RewardJpaEntity.builder()
        .id(domain.getId())
        .userId(domain.getUserId())
        .name(domain.getName())
        .icon(domain.getIcon().orElse(null))
        .description(domain.getDescription().orElse(null))
        .orderIndex(domain.getOrder_index())
        .price(domain.getPrice())
        .tags(domain.getTags() != null ? new ArrayList<>(domain.getTags()) : new ArrayList<>())
        .type(domain.getType())
        .category(domain.getCategory().orElse(null))
        .packageLevel(domain.getPackageLevel().orElse(null))
        .baseDurationMinutes(domain.getBaseDurationMinutes().orElse(null))
        .lootItems(domain.getLootItems() != null ? new ArrayList<>(domain.getLootItems()) : null)
        .build();
  }

  public void updateEntityFromDomain(RewardJpaEntity entity, Reward domain) {
    entity.setName(domain.getName());
    entity.setIcon(domain.getIcon().orElse(null));
    entity.setDescription(domain.getDescription().orElse(null));
    entity.setOrderIndex(domain.getOrder_index());
    entity.setPrice(domain.getPrice());
    entity.setTags(domain.getTags() != null ? new ArrayList<>(domain.getTags()) : new ArrayList<>());
    entity.setType(domain.getType());
    entity.setCategory(domain.getCategory().orElse(null));
    entity.setPackageLevel(domain.getPackageLevel().orElse(null));
    entity.setBaseDurationMinutes(domain.getBaseDurationMinutes().orElse(null));
    entity.setLootItems(domain.getLootItems() != null ? new ArrayList<>(domain.getLootItems()) : null);
  }

  public Reward toDomain(RewardJpaEntity entity) {
    List<String> domainTags = entity.getTags() != null ? entity.getTags() : new ArrayList<>();
    return new Reward(
        entity.getId(),
        entity.getUserId(),
        entity.getName(),
        entity.getPrice(),
        domainTags,
        entity.getType(),
        entity.getOrderIndex(),
        entity.getIcon(),
        entity.getDescription(),
        entity.getCategory(),
        entity.getBaseDurationMinutes(),
        entity.getPackageLevel(),
        entity.getLootItems());
  }
}
