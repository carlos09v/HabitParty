package com.habitparty.adapters.out.persistence.mappers;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.entities.TransactionHistoryJpaEntity;
import com.habitparty.core.domain.entities.TransactionHistory;

@Component
public class TransactionHistoryMapper {

  public TransactionHistoryJpaEntity toEntity(TransactionHistory domain) {
    return TransactionHistoryJpaEntity.builder()
        .id(domain.getId())
        .userId(domain.getUserId())
        .transactionType(domain.getTransactionType())
        .createdAt(domain.getCreatedAt())
        .referenceId(domain.getReferenceId().orElse(null))
        .nameSnapshot(domain.getNameSnapshot())
        .goldAmount(domain.getGoldAmount().orElse(null))
        .xpAmount(domain.getXpAmount())
        .priceSnapshot(domain.getPriceSnapshot().orElse(null))
        .iconSnapshot(domain.getIconSnapshot().orElse(null))
        .difficultySnapshot(domain.getDifficultySnapshot().orElse(null))
        .packageLevelSnapshot(domain.getPackageLevelSnapshot().orElse(null))
        .tagsSnapshot(domain.getTagsSnapshot().map(ArrayList::new).orElse(null))
        .columnNameSnapshot(domain.getColumnNameSnapshot().orElse(null))
        .descriptionSnapshot(domain.getDescriptionSnapshot().orElse(null))
        .checklistCompletedSnapshot(domain.getChecklistCompletedSnapshot().orElse(null))
        .effortUnitsSnapshot(domain.getEffortUnitsSnapshot().orElse(null))
        .hiddenFromHistory(false)
        .build();
  }

  public TransactionHistory toDomain(TransactionHistoryJpaEntity entity) {
    List<String> domainTags = entity.getTagsSnapshot() != null ? entity.getTagsSnapshot() : new ArrayList<>();

    return new TransactionHistory(
        entity.getId(),
        entity.getUserId(),
        entity.getReferenceId(),
        entity.getGoldAmount(),
        entity.getXpAmount() != null ? entity.getXpAmount() : 0,
        entity.getPriceSnapshot(),
        entity.getTransactionType(),
        entity.getNameSnapshot(),
        entity.getIconSnapshot(),
        entity.getPackageLevelSnapshot(),
        entity.getDifficultySnapshot(),
        domainTags,
        entity.getColumnNameSnapshot(),
        entity.getDescriptionSnapshot(),
        entity.getChecklistCompletedSnapshot(),
        entity.getEffortUnitsSnapshot(),
        entity.getCreatedAt());
  }
}
