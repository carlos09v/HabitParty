package com.habitparty.adapters.in.web.dtos.response.social;

import java.util.UUID;

import com.habitparty.application.usecases.social.SearchSocialUsersUseCase;
import com.habitparty.application.usecases.social.SocialRelationshipStatus;

public record SearchSocialUserResponseDTO(
    SocialUserSummaryDTO user,
    SocialRelationshipStatus relationshipStatus,
    UUID friendshipId,
    boolean matchedByFriendCode,
    boolean canSendRequest) {

  public static SearchSocialUserResponseDTO fromDomain(SearchSocialUsersUseCase.SearchSocialUserItem item) {
    return new SearchSocialUserResponseDTO(
        SocialUserSummaryDTO.fromDomain(item.user()),
        item.relationshipStatus(),
        item.friendshipId(),
        item.matchedByFriendCode(),
        item.canSendRequest());
  }
}
