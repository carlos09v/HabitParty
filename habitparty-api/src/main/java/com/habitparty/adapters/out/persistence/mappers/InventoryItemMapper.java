package com.habitparty.adapters.out.persistence.mappers;

import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.entities.InventoryItemJpaEntity;
import com.habitparty.adapters.out.persistence.entities.UserJpaEntity;
import com.habitparty.core.domain.entities.InventoryItem;

@Component
public class InventoryItemMapper {
  public InventoryItemJpaEntity toEntity(InventoryItem domain) {
        // Cria um user vazio apenas para carregar o ID da chave estrangeira
        UserJpaEntity userReference = new UserJpaEntity();
        userReference.setId(domain.getUserId());

        InventoryItemJpaEntity entity = new InventoryItemJpaEntity();
        entity.setId(domain.getId());
        entity.setUser(userReference);
        entity.setRewardId(domain.getRewardId());
        
        // Snapshots
        entity.setNameSnapshot(domain.getNameSnapshot());
        entity.setIconSnapshot(domain.getIconSnapshot().orElse(null));
        entity.setPriceSnapshot(domain.getPriceSnapshot());
        entity.setPackageLevelSnapshot(domain.getPackageLevelSnapshot().orElse(null));
        entity.setRewardTypeSnapshot(domain.getRewardTypeSnapshot());
        
        // Dados de estado
        entity.setStatus(domain.getStatus());
        entity.setOrderIndex(domain.getOrderIndex());
        entity.setRemainingMinutes(domain.getRemainingMinutes().orElse(null));
        entity.setAcquiredAt(domain.getAcquiredAt());

        return entity;
    }

    public InventoryItem toDomain(InventoryItemJpaEntity entity) {
        return new InventoryItem(
            entity.getId(),
            entity.getUser().getId(),
            entity.getRewardId(),
            entity.getNameSnapshot(),
            entity.getPriceSnapshot(),
            entity.getRewardTypeSnapshot(),
            entity.getStatus(),
            entity.getOrderIndex(),
            entity.getIconSnapshot(),
            entity.getPackageLevelSnapshot(),
            entity.getRemainingMinutes(),
            entity.getAcquiredAt()
        );
    }
}
