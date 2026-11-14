package com.habitparty.adapters.in.web.dtos.response.social;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.habitparty.application.usecases.social.ListSocialNotificationsUseCase;
import com.habitparty.core.domain.enums.SocialNotificationType;

public record SocialNotificationsFeedResponseDTO(
    long unseenCount,
    List<SocialNotificationResponseDTO> notifications) {

  public record SocialNotificationResponseDTO(
      UUID id,
      SocialNotificationType type,
      UUID referenceId,
      String payload,
      boolean seen,
      Instant createdAt,
      UUID actorId,
      String actorUsername,
      String actorFullName,
      String actorAvatarUrl,
      String actorAvatarFrame,
      boolean actorIsPremium) {

    public static SocialNotificationResponseDTO fromDomain(
        ListSocialNotificationsUseCase.SocialNotificationItem item) {
      return new SocialNotificationResponseDTO(
          item.id(),
          item.type(),
          item.referenceId(),
          item.payload(),
          item.seen(),
          item.createdAt(),
          item.actorId(),
          item.actorUsername(),
          item.actorFullName(),
          item.actorAvatarUrl(),
          item.actorAvatarFrame(),
          item.actorIsPremium());
    }
  }

  public static SocialNotificationsFeedResponseDTO fromDomain(
      ListSocialNotificationsUseCase.SocialNotificationsResult result) {
    return new SocialNotificationsFeedResponseDTO(
        result.unseenCount(),
        result.notifications().stream().map(SocialNotificationResponseDTO::fromDomain).toList());
  }
}
