package com.habitparty.adapters.in.web.dtos.response.social;

import java.util.UUID;

import com.habitparty.application.usecases.social.RespondFriendRequestUseCase;

public record RespondFriendRequestResponseDTO(
    UUID friendshipId,
    boolean accepted) {

  public static RespondFriendRequestResponseDTO fromDomain(
      RespondFriendRequestUseCase.RespondFriendRequestResult result) {
    return new RespondFriendRequestResponseDTO(result.friendshipId(), result.accepted());
  }
}
