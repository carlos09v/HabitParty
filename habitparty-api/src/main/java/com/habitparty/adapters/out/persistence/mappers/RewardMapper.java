package com.habitparty.adapters.out.persistence.mappers;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.entities.RewardJpaEntity;
import com.habitparty.adapters.out.persistence.entities.UserJpaEntity;
import com.habitparty.core.domain.entities.reward.Reward;

@Component
public class RewardMapper {
  public RewardJpaEntity toEntity(Reward domain) {
    // Cria um user vazio apenas para carregar o ID
    UserJpaEntity userReference = new UserJpaEntity();
    userReference.setId(domain.getUserId());

    RewardJpaEntity entity = new RewardJpaEntity();
    entity.setId(domain.getId());
    entity.setUser(userReference);
    entity.setName(domain.getName());
    entity.setIcon(domain.getIcon().orElse(null));
    entity.setDescription(domain.getDescription().orElse(null));
    entity.setOrderIndex(domain.getOrder_index());
    entity.setPrice(domain.getPrice());
    entity.setTags(domain.getTags());
    entity.setType(domain.getType());
    entity.setCategory(domain.getCategory().orElse(null));
    entity.setPackageLevel(domain.getPackageLevel().orElse(null));
    entity.setBaseDurationMinutes(domain.getBaseDurationMinutes().orElse(null));

    return entity;
  }

  public Reward toDomain(RewardJpaEntity entity) {
    // Tratamento de segurança para listas nulas vindas do banco
    List<String> domainTags = entity.getTags() != null ? entity.getTags() : new ArrayList<>()
    ;
    return new Reward(
       entity.getId(),
        entity.getUser().getId(),
        entity.getName(),
        entity.getPrice(),
        domainTags,
        entity.getType(),
        entity.getOrderIndex(),
        entity.getIcon(),
        entity.getDescription(),
        entity.getCategory(),
        entity.getBaseDurationMinutes(),
        entity.getPackageLevel()
    );
  }
}
