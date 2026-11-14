package com.habitparty.adapters.in.web.dtos.response.social;

import java.util.UUID;

import com.habitparty.application.usecases.social.SendFriendRequestUseCase;
import com.habitparty.application.usecases.social.SocialRelationshipStatus;

public record SendFriendRequestResponseDTO(
    UUID friendshipId,
    SocialRelationshipStatus relationshipStatus,
    boolean autoAccepted,
    SocialUserSummaryDTO targetUser) {

  public static SendFriendRequestResponseDTO fromDomain(SendFriendRequestUseCase.SendFriendRequestResult result) {
    SocialRelationshipStatus status = result.autoAccepted()
        ? SocialRelationshipStatus.FRIENDS
        : SocialRelationshipStatus.PENDING_SENT;
    return new SendFriendRequestResponseDTO(
        result.friendship().getId(),
        status,
        result.autoAccepted(),
        SocialUserSummaryDTO.fromDomain(result.targetUser()));
  }
}
