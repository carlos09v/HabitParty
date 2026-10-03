package com.habitparty.adapters.out.persistence.mappers;

import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.entities.FocusActivityJpaEntity;
import com.habitparty.core.domain.entities.focus.FocusActivity;
import com.habitparty.core.domain.enums.FocusRecordType;

@Component
public class FocusActivityMapper {
  public FocusActivityJpaEntity toEntity(FocusActivity domain) {
    if (domain == null)
      return null;

    // Diferente do Inventory, não precisamos criar um objeto User falso!
    // O UUID vai direto para a coluna.
    FocusActivityJpaEntity entity = new FocusActivityJpaEntity();

    entity.setId(domain.getId());
    entity.setUserId(domain.getUserId());
    entity.setName(domain.getName());
    entity.setIcon(domain.getIcon());
    entity.setOrderIndex(domain.getOrderIndex());

    // Conversão segura do Enum do Domínio para o Enum do JPA
    if (domain.getRecordType() != null) {
      entity.setRecordType(FocusRecordType.valueOf(domain.getRecordType().name()));
    }

    entity.setPomoTimeMinutes(domain.getPomoDurationMinutes().orElse(null));
    entity.setCreatedAt(domain.getCreatedAt());

    return entity;
  }

  public FocusActivity toDomain(FocusActivityJpaEntity entity) {
    if (entity == null)
      return null;

    // Conversão segura do Enum do JPA para o Enum do Domínio
    FocusRecordType domainRecordType = entity.getRecordType() != null
        ? FocusRecordType.valueOf(entity.getRecordType().name())
        : null;

    return new FocusActivity(
        entity.getId(),
        entity.getUserId(),
        entity.getName(),
        entity.getIcon(),
        entity.getOrderIndex(),
        domainRecordType,
        entity.getPomoTimeMinutes(),
        entity.getCreatedAt());
  }
}
