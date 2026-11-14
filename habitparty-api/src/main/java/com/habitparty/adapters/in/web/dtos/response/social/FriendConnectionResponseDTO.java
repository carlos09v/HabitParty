package com.habitparty.adapters.in.web.dtos.response.social;

import java.time.Instant;
import java.util.UUID;

import com.habitparty.application.usecases.social.ListFriendsOverviewUseCase;
import com.habitparty.application.usecases.social.SocialRelationshipStatus;

public record FriendConnectionResponseDTO(
    UUID friendshipId,
    SocialRelationshipStatus relationshipStatus,
    Instant connectedAt,
    Instant requestedAt,
    SocialUserSummaryDTO user) {

  public static FriendConnectionResponseDTO fromDomain(ListFriendsOverviewUseCase.FriendConnectionItem item) {
    return new FriendConnectionResponseDTO(
        item.friendshipId(),
        item.relationshipStatus(),
        item.connectedAt(),
        item.requestedAt(),
        SocialUserSummaryDTO.fromDomain(item.user()));
  }
}
