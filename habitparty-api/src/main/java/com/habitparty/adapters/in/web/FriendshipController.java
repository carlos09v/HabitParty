package com.habitparty.adapters.in.web;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import com.habitparty.adapters.in.web.api.FriendshipApi;
import com.habitparty.adapters.in.web.dtos.request.social.MarkNotificationsSeenDTO;
import com.habitparty.adapters.in.web.dtos.request.social.RespondFriendRequestDTO;
import com.habitparty.adapters.in.web.dtos.request.social.SendFriendRequestDTO;
import com.habitparty.adapters.in.web.dtos.response.social.FriendsOverviewResponseDTO;
import com.habitparty.adapters.in.web.dtos.response.social.RespondFriendRequestResponseDTO;
import com.habitparty.adapters.in.web.dtos.response.social.SearchSocialUserResponseDTO;
import com.habitparty.adapters.in.web.dtos.response.social.SendFriendRequestResponseDTO;
import com.habitparty.adapters.in.web.dtos.response.social.SocialNotificationsFeedResponseDTO;
import com.habitparty.application.usecases.social.ListFriendsOverviewUseCase;
import com.habitparty.application.usecases.social.ListSocialNotificationsUseCase;
import com.habitparty.application.usecases.social.MarkSocialNotificationsSeenUseCase;
import com.habitparty.application.usecases.social.RemoveOrBlockFriendUseCase;
import com.habitparty.application.usecases.social.RespondFriendRequestUseCase;
import com.habitparty.application.usecases.social.SearchSocialUsersUseCase;
import com.habitparty.application.usecases.social.SendFriendRequestCommand;
import com.habitparty.application.usecases.social.SendFriendRequestUseCase;
import com.habitparty.infrastructure.security.AuthenticatedUser;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@RestController
public class FriendshipController implements FriendshipApi {

  private final ListFriendsOverviewUseCase listFriendsOverviewUseCase;
  private final SearchSocialUsersUseCase searchSocialUsersUseCase;
  private final SendFriendRequestUseCase sendFriendRequestUseCase;
  private final RespondFriendRequestUseCase respondFriendRequestUseCase;
  private final RemoveOrBlockFriendUseCase removeOrBlockFriendUseCase;
  private final ListSocialNotificationsUseCase listSocialNotificationsUseCase;
  private final MarkSocialNotificationsSeenUseCase markSocialNotificationsSeenUseCase;

  @Override
  public ResponseEntity<FriendsOverviewResponseDTO> getFriendsOverview(AuthenticatedUser usuarioLogado) {
    var result = listFriendsOverviewUseCase.execute(usuarioLogado.id());
    return ResponseEntity.ok(FriendsOverviewResponseDTO.fromDomain(result));
  }

  @Override
  public ResponseEntity<List<SearchSocialUserResponseDTO>> searchUsers(
      AuthenticatedUser usuarioLogado,
      String query) {
    var results = searchSocialUsersUseCase.execute(usuarioLogado.id(), query).stream()
        .map(SearchSocialUserResponseDTO::fromDomain)
        .toList();
    return ResponseEntity.ok(results);
  }

  @Override
  public ResponseEntity<SendFriendRequestResponseDTO> sendFriendRequest(
      AuthenticatedUser usuarioLogado,
      SendFriendRequestDTO requestDto) {
    var command = new SendFriendRequestCommand(
        usuarioLogado.id(),
        requestDto.username(),
        requestDto.friendCode());
    var result = sendFriendRequestUseCase.execute(command);
    HttpStatus status = result.autoAccepted() ? HttpStatus.OK : HttpStatus.CREATED;
    return ResponseEntity.status(status).body(SendFriendRequestResponseDTO.fromDomain(result));
  }

  @Override
  public ResponseEntity<RespondFriendRequestResponseDTO> respondFriendRequest(
      AuthenticatedUser usuarioLogado,
      UUID friendshipId,
      RespondFriendRequestDTO requestDto) {
    var result = respondFriendRequestUseCase.execute(
        usuarioLogado.id(),
        friendshipId,
        Boolean.TRUE.equals(requestDto.accept()));
    return ResponseEntity.ok(RespondFriendRequestResponseDTO.fromDomain(result));
  }

  @Override
  public ResponseEntity<Void> removeFriendship(
      AuthenticatedUser usuarioLogado,
      UUID friendshipId) {
    removeOrBlockFriendUseCase.removeFriendship(usuarioLogado.id(), friendshipId);
    return ResponseEntity.noContent().build();
  }

  @Override
  public ResponseEntity<Void> blockUser(
      AuthenticatedUser usuarioLogado,
      UUID userId) {
    removeOrBlockFriendUseCase.blockUser(usuarioLogado.id(), userId);
    return ResponseEntity.noContent().build();
  }

  @Override
  public ResponseEntity<SocialNotificationsFeedResponseDTO> listNotifications(
      AuthenticatedUser usuarioLogado,
      int limit) {
    var result = listSocialNotificationsUseCase.execute(usuarioLogado.id(), limit);
    return ResponseEntity.ok(SocialNotificationsFeedResponseDTO.fromDomain(result));
  }

  @Override
  public ResponseEntity<Void> markNotificationsSeen(
      AuthenticatedUser usuarioLogado,
      MarkNotificationsSeenDTO requestDto) {
    if (requestDto != null && requestDto.notificationId() != null) {
      markSocialNotificationsSeenUseCase.markOneSeen(usuarioLogado.id(), requestDto.notificationId());
    } else {
      markSocialNotificationsSeenUseCase.markAllSeen(usuarioLogado.id());
    }
    return ResponseEntity.noContent().build();
  }
}
