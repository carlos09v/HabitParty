package com.habitparty.adapters.out.persistence.mappers;

import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.entities.FocusRecordJpaEntity;
import com.habitparty.core.domain.entities.focus.FocusRecord;

@Component
public class FocusRecordMapper {
  public FocusRecordJpaEntity toEntity(FocusRecord domain) {
        if (domain == null) return null;

        FocusRecordJpaEntity entity = new FocusRecordJpaEntity();
        entity.setId(domain.getId());
        entity.setUserId(domain.getUserId());
        entity.setFocusActivityId(domain.getFocusActivityId().orElse(null));
        entity.setInventoryItemId(domain.getInventoryItemId().orElse(null));
        entity.setNotes(domain.getNotes().orElse(null));
        entity.setStartTime(domain.getStartTime());
        entity.setEndTime(domain.getEndTime());
        entity.setRecordType(domain.getRecordType().orElse(null));
        entity.setCompletedPomos(domain.getCompletedPomos().orElse(null));
        entity.setDurationMinutes(domain.getDurationMinutes());

        return entity;
    }

    public FocusRecord toDomain(FocusRecordJpaEntity entity) {
        if (entity == null) return null;

        return new FocusRecord(
            entity.getId(),
            entity.getUserId(),
            entity.getFocusActivityId(), // Construtor do Domínio aceita null e o transforma em Optional no getter
            entity.getInventoryItemId(),
            entity.getNotes(),
            entity.getStartTime(),
            entity.getEndTime(),
            entity.getRecordType(),
            entity.getCompletedPomos()
        );
    }
}
