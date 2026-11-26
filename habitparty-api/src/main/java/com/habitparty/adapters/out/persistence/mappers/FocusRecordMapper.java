package com.habitparty.adapters.out.persistence.mappers;

import java.math.BigDecimal;

import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.entities.FocusRecordJpaEntity;
import com.habitparty.core.domain.entities.focus.FocusRecord;

@Component
public class FocusRecordMapper {

  public FocusRecordJpaEntity toEntity(FocusRecord domain) {
    if (domain == null) {
      return null;
    }
    return FocusRecordJpaEntity.builder()
        .id(domain.getId())
        .userId(domain.getUserId())
        .focusActivityId(domain.getFocusActivityId().orElse(null))
        .inventoryItemId(domain.getInventoryItemId().orElse(null))
        .taskId(domain.getTaskId().orElse(null))
        .taskNameSnapshot(domain.getTaskNameSnapshot().orElse(null))
        .notes(domain.getNotes().orElse(null))
        .startTime(domain.getStartTime())
        .endTime(domain.getEndTime())
        .recordType(domain.getRecordType().orElse(null))
        .completedPomos(domain.getCompletedPomos().orElse(null))
        .pomoTargetMinutes(domain.getPomoTargetMinutes().orElse(null))
        .durationMinutes(domain.getDurationMinutes())
        .xpEarned(domain.getXpEarned().orElse(0))
        .coinsEarned(domain.getCoinsEarned().orElse(BigDecimal.ZERO))
        .rewardLocked(domain.isRewardLocked())
        .build();
  }

  public void updateEntityFromDomain(FocusRecordJpaEntity entity, FocusRecord domain) {
    entity.setFocusActivityId(domain.getFocusActivityId().orElse(null));
    entity.setInventoryItemId(domain.getInventoryItemId().orElse(null));
    entity.setTaskId(domain.getTaskId().orElse(null));
    entity.setTaskNameSnapshot(domain.getTaskNameSnapshot().orElse(null));
    entity.setNotes(domain.getNotes().orElse(null));
    entity.setStartTime(domain.getStartTime());
    entity.setEndTime(domain.getEndTime());
    entity.setRecordType(domain.getRecordType().orElse(null));
    entity.setCompletedPomos(domain.getCompletedPomos().orElse(null));
    entity.setPomoTargetMinutes(domain.getPomoTargetMinutes().orElse(null));
    entity.setDurationMinutes(domain.getDurationMinutes());
    entity.setXpEarned(domain.getXpEarned().orElse(0));
    entity.setCoinsEarned(domain.getCoinsEarned().orElse(BigDecimal.ZERO));
    entity.setRewardLocked(domain.isRewardLocked());
  }

  public FocusRecord toDomain(FocusRecordJpaEntity entity) {
    if (entity == null) {
      return null;
    }
    return new FocusRecord(
        entity.getId(),
        entity.getUserId(),
        entity.getFocusActivityId(),
        entity.getInventoryItemId(),
        entity.getTaskId(),
        entity.getTaskNameSnapshot(),
        entity.getNotes(),
        entity.getStartTime(),
        entity.getEndTime(),
        entity.getRecordType(),
        entity.getCompletedPomos(),
        entity.getPomoTargetMinutes(),
        entity.getXpEarned() != null ? entity.getXpEarned() : 0,
        entity.getCoinsEarned() != null ? entity.getCoinsEarned() : BigDecimal.ZERO,
        entity.isRewardLocked());
  }
}
