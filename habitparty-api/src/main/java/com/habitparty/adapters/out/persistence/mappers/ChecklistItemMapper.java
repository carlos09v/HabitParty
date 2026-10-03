package com.habitparty.adapters.out.persistence.mappers;

import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.entities.ChecklistItemJpaEntity;
import com.habitparty.adapters.out.persistence.entities.TaskJpaEntity;
import com.habitparty.core.domain.entities.task.ChecklistItem;

@Component 
public class ChecklistItemMapper {
  public ChecklistItem toDomain(ChecklistItemJpaEntity entity) {
        return new ChecklistItem(
            entity.getId(),
            entity.getTask().getId(),
            entity.getUserId(),
            entity.getName(),
            entity.isCompleted()
        );
    }

    public ChecklistItemJpaEntity toEntity(ChecklistItem domain, TaskJpaEntity taskEntity) {
        ChecklistItemJpaEntity entity = new ChecklistItemJpaEntity();
        entity.setId(domain.getId());
        entity.setTask(taskEntity); // Recebe a Task do banco
        entity.setUserId(domain.getUserId());
        entity.setName(domain.getName());
        entity.setCompleted(domain.isCompleted());
        return entity;
    }
}
