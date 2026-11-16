package com.habitparty.adapters.out.persistence;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.adapters.out.persistence.entities.SocialNotificationJpaEntity;
import com.habitparty.adapters.out.persistence.mappers.SocialNotificationMapper;
import com.habitparty.adapters.out.persistence.repository.SocialNotificationJpaRepository;
import com.habitparty.application.ports.SocialNotificationRepository;
import com.habitparty.core.domain.entities.social.SocialNotification;
import com.habitparty.core.domain.enums.SocialNotificationType;

@Component
public class SocialNotificationAdapter implements SocialNotificationRepository {

  private final SocialNotificationJpaRepository repository;
  private final SocialNotificationMapper mapper;

  public SocialNotificationAdapter(
      SocialNotificationJpaRepository repository,
      SocialNotificationMapper mapper) {
    this.repository = repository;
    this.mapper = mapper;
  }

  @Override
  public List<SocialNotification> findRecentByRecipientId(UUID recipientId, int limit) {
    int safeLimit = Math.max(1, Math.min(limit, 100));
    return repository.findByRecipientIdOrderByCreatedAtDesc(recipientId, PageRequest.of(0, safeLimit))
        .stream()
        .map(mapper::toDomain)
        .toList();
  }

  @Override
  public List<SocialNotification> findUnseenRecentByRecipientId(UUID recipientId, int limit) {
    int safeLimit = Math.max(1, Math.min(limit, 100));
    return repository.findByRecipientIdAndSeenFalseOrderByCreatedAtDesc(recipientId, PageRequest.of(0, safeLimit))
        .stream()
        .map(mapper::toDomain)
        .toList();
  }

  @Override
  public long countUnseenByRecipientId(UUID recipientId) {
    return repository.countByRecipientIdAndSeenFalse(recipientId);
  }

  @Override
  @Transactional
  public SocialNotification save(SocialNotification notification) {
    SocialNotificationJpaEntity saved = repository.save(mapper.toEntity(notification));
    return mapper.toDomain(saved);
  }

  @Override
  @Transactional
  public List<SocialNotification> saveAll(List<SocialNotification> notifications) {
    if (notifications == null || notifications.isEmpty()) {
      return List.of();
    }
    List<SocialNotificationJpaEntity> entities = notifications.stream()
        .map(mapper::toEntity)
        .toList();
    return repository.saveAll(entities).stream()
        .map(mapper::toDomain)
        .toList();
  }

  @Override
  @Transactional
  public void markAllSeenByRecipientId(UUID recipientId) {
    repository.markAllSeenByRecipientId(recipientId);
  }

  @Override
  @Transactional
  public void markSeenByIdAndRecipientId(UUID notificationId, UUID recipientId) {
    repository.markSeenByIdAndRecipientId(notificationId, recipientId);
  }

  @Override
  @Transactional
  public void markSeenByReferenceIdAndType(UUID referenceId, SocialNotificationType type) {
    repository.markSeenByReferenceIdAndType(referenceId, type);
  }

  @Override
  @Transactional
  public void markSeenBetweenUsers(UUID userId, UUID otherUserId) {
    repository.markSeenBetweenUsers(userId, otherUserId);
  }

  @Override
  @Transactional
  public void deleteAllByUserId(UUID userId) {
    repository.deleteAllByUserId(userId);
  }
}
