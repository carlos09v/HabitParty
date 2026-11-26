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
    return SocialNotificationJpaEntity.builder()
        .id(domain.getId())
        .recipientId(domain.getRecipientId())
        .actorId(domain.getActorId())
        .notificationType(domain.getType())
        .referenceId(domain.getReferenceId())
        .payload(domain.getPayload())
        .seen(domain.isSeen())
        .createdAt(domain.getCreatedAt())
        .build();
  }
}
