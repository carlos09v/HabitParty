package com.habitparty.application.usecases.social;

import java.time.Instant;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.FriendshipRepository;
import com.habitparty.application.ports.SocialNotificationRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.usecases.user.UserTimeResolver;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.social.Friendship;
import com.habitparty.core.domain.entities.social.SocialNotification;
import com.habitparty.core.domain.enums.SocialNotificationType;
import com.habitparty.core.exceptions.LimitExceededException;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class RespondFriendRequestUseCase {

  private final FriendshipRepository friendshipRepository;
  private final UserRepository userRepository;
  private final SocialNotificationRepository notificationRepository;
  private final UserTimeResolver timeResolver;

  public RespondFriendRequestUseCase(
      FriendshipRepository friendshipRepository,
      UserRepository userRepository,
      SocialNotificationRepository notificationRepository,
      UserTimeResolver timeResolver) {
    this.friendshipRepository = friendshipRepository;
    this.userRepository = userRepository;
    this.notificationRepository = notificationRepository;
    this.timeResolver = timeResolver;
  }

  public record RespondFriendRequestResult(
      UUID friendshipId,
      boolean accepted) {
  }

  @Transactional
  public RespondFriendRequestResult execute(UUID actorId, UUID friendshipId, boolean accept) {
    Friendship friendship = friendshipRepository.findById(friendshipId)
        .orElseThrow(() -> new ResourceNotFoundException("Solicitação de amizade não encontrada."));

    if (!accept) {
      friendship.ensureCanDelete(actorId);
      friendshipRepository.delete(friendship);
      notificationRepository.markSeenByReferenceIdAndType(
          friendshipId, SocialNotificationType.FRIEND_REQUEST_RECEIVED);
      return new RespondFriendRequestResult(friendshipId, false);
    }

    Instant now = timeResolver.nowInstant();
    friendship.accept(actorId, now);

    if (friendshipRepository.countAcceptedByUserId(actorId) >= SendFriendRequestUseCase.MAX_FRIENDS) {
      throw new LimitExceededException(
          "Você atingiu o limite máximo de " + SendFriendRequestUseCase.MAX_FRIENDS + " amigos.");
    }
    UUID requesterId = friendship.getRequesterId();
    if (friendshipRepository.countAcceptedByUserId(requesterId) >= SendFriendRequestUseCase.MAX_FRIENDS) {
      throw new LimitExceededException("O usuário solicitante já atingiu o limite máximo de amigos.");
    }

    Friendship saved = friendshipRepository.save(friendship);
    notificationRepository.markSeenByReferenceIdAndType(
        saved.getId(), SocialNotificationType.FRIEND_REQUEST_RECEIVED);
    User actor = userRepository.findById(actorId).orElse(null);

    notificationRepository.save(SocialNotification.create(
        requesterId,
        actorId,
        SocialNotificationType.FRIEND_REQUEST_ACCEPTED,
        saved.getId(),
        actor != null ? SocialNotificationPayloadHelper.actorOnly(actor) : null,
        now));

    return new RespondFriendRequestResult(saved.getId(), true);
  }
}
