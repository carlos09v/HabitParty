package com.habitparty.adapters.out.persistence.mappers;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.entities.TransactionHistoryJpaEntity;
import com.habitparty.adapters.out.persistence.entities.UserJpaEntity;
import com.habitparty.core.domain.entities.TransactionHistory;

@Component
public class TransactionHistoryMapper {
  public TransactionHistoryJpaEntity toEntity(TransactionHistory domain) {
        // Cria um user vazio apenas para carregar o ID
        UserJpaEntity userReference = new UserJpaEntity();
        userReference.setId(domain.getUserId());

        TransactionHistoryJpaEntity entity = new TransactionHistoryJpaEntity();
        entity.setId(domain.getId());
        entity.setUser(userReference);
        entity.setTransactionType(domain.getTransactionType());
        entity.setCreatedAt(domain.getCreatedAt());
        
        // O Soft-link unificado
        entity.setReferenceId(domain.getReferenceId().orElse(null));
        
        // Snapshots
        entity.setNameSnapshot(domain.getNameSnapshot());
        entity.setGoldAmount(domain.getGoldAmount().orElse(null));
        entity.setXpAmount(domain.getXpAmount());
        entity.setPriceSnapshot(domain.getPriceSnapshot().orElse(null));
        entity.setIconSnapshot(domain.getIconSnapshot().orElse(null));
        entity.setDifficultySnapshot(domain.getDifficultySnapshot().orElse(null));
        entity.setPackageLevelSnapshot(domain.getPackageLevelSnapshot().orElse(null));
        entity.setTagsSnapshot(domain.getTagsSnapshot().orElse(null));

        return entity;
    }

    public TransactionHistory toDomain(TransactionHistoryJpaEntity entity) {
        // Tratamento de segurança para listas nulas vindas do banco
        List<String> domainTags = entity.getTagsSnapshot() != null ? entity.getTagsSnapshot() : new ArrayList<>();

        return new TransactionHistory(
            entity.getId(),
            entity.getUser().getId(),
            entity.getReferenceId(),
            entity.getGoldAmount(),
            entity.getXpAmount(),
            entity.getPriceSnapshot(),
            entity.getTransactionType(),
            entity.getNameSnapshot(),
            entity.getIconSnapshot(),
            entity.getPackageLevelSnapshot(),
            entity.getDifficultySnapshot(),
            domainTags,
            entity.getCreatedAt()
        );
    }
}
