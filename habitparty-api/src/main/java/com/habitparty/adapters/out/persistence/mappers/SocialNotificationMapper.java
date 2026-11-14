package com.habitparty.adapters.out.persistence.mappers;

import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.entities.SocialNotificationJpaEntity;
import com.habitparty.core.domain.entities.social.SocialNotification;

@Component
public class SocialNotificationMapper {

  public SocialNotification toDomain(SocialNotificationJpaEntity entity) {
    if (entity == null) {
      return null;
    }
    return new SocialNotification(
        entity.getId(),
        entity.getRecipientId(),
        entity.getActorId(),
        entity.getNotificationType(),
        entity.getReferenceId(),
        entity.getPayload(),
        entity.isSeen(),
        entity.getCreatedAt());
  }

  public SocialNotificationJpaEntity toEntity(SocialNotification domain) {
    if (domain == null) {
      return null;
    }
    SocialNotificationJpaEntity entity = new SocialNotificationJpaEntity();
    entity.setId(domain.getId());
    entity.setRecipientId(domain.getRecipientId());
    entity.setActorId(domain.getActorId());
    entity.setNotificationType(domain.getType());
    entity.setReferenceId(domain.getReferenceId());
    entity.setPayload(domain.getPayload());
    entity.setSeen(domain.isSeen());
    entity.setCreatedAt(domain.getCreatedAt());
    return entity;
  }
}
