package com.habitparty.adapters.in.web.dtos.response.social;

import java.util.List;

import com.habitparty.application.usecases.social.ListFriendsOverviewUseCase;

public record FriendsOverviewResponseDTO(
    String myFriendCode,
    int friendsCount,
    int maxFriends,
    List<FriendConnectionResponseDTO> friends,
    List<FriendConnectionResponseDTO> incomingRequests,
    List<FriendConnectionResponseDTO> outgoingRequests,
    List<FriendConnectionResponseDTO> blockedUsers) {

  public static FriendsOverviewResponseDTO fromDomain(ListFriendsOverviewUseCase.FriendsOverviewResult result) {
    return new FriendsOverviewResponseDTO(
        result.myFriendCode(),
        result.friendsCount(),
        result.maxFriends(),
        result.friends().stream().map(FriendConnectionResponseDTO::fromDomain).toList(),
        result.incomingRequests().stream().map(FriendConnectionResponseDTO::fromDomain).toList(),
        result.outgoingRequests().stream().map(FriendConnectionResponseDTO::fromDomain).toList(),
        result.blockedUsers().stream().map(FriendConnectionResponseDTO::fromDomain).toList());
  }
}
