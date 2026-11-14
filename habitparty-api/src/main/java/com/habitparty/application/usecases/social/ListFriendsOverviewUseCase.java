package com.habitparty.application.usecases.social;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.FriendshipRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.usecases.user.EffectiveStreakResolver;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.social.Friendship;
import com.habitparty.core.domain.enums.FriendshipStatus;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class ListFriendsOverviewUseCase {

  private final UserRepository userRepository;
  private final FriendshipRepository friendshipRepository;
  private final EffectiveStreakResolver effectiveStreakResolver;

  public ListFriendsOverviewUseCase(
      UserRepository userRepository,
      FriendshipRepository friendshipRepository,
      EffectiveStreakResolver effectiveStreakResolver) {
    this.userRepository = userRepository;
    this.friendshipRepository = friendshipRepository;
    this.effectiveStreakResolver = effectiveStreakResolver;
  }

  public record FriendConnectionItem(
      UUID friendshipId,
      SocialRelationshipStatus relationshipStatus,
      Instant connectedAt,
      Instant requestedAt,
      SocialUserSummary user) {
  }

  public record FriendsOverviewResult(
      String myFriendCode,
      int friendsCount,
      int maxFriends,
      List<FriendConnectionItem> friends,
      List<FriendConnectionItem> incomingRequests,
      List<FriendConnectionItem> outgoingRequests,
      List<FriendConnectionItem> blockedUsers) {
  }

  @Transactional(readOnly = true)
  public FriendsOverviewResult execute(UUID userId) {
    User currentUser = userRepository.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

    List<Friendship> allInvolving = friendshipRepository.findAllInvolvingUser(userId);
    List<Friendship> accepted = new ArrayList<>();
    List<Friendship> incoming = new ArrayList<>();
    List<Friendship> outgoing = new ArrayList<>();
    List<Friendship> blocked = new ArrayList<>();

    for (Friendship f : allInvolving) {
      if (f.getStatus() == FriendshipStatus.ACCEPTED) {
        accepted.add(f);
      } else if (f.getStatus() == FriendshipStatus.PENDING) {
        if (userId.equals(f.getAddresseeId())) {
          incoming.add(f);
        } else if (userId.equals(f.getRequesterId())) {
          outgoing.add(f);
        }
      } else if (f.getStatus() == FriendshipStatus.BLOCKED && userId.equals(f.getRequesterId())) {
        blocked.add(f);
      }
    }

    Comparator<Friendship> byCreatedDesc =
        Comparator.comparing(Friendship::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder()));
    Comparator<Friendship> byRespondedDesc =
        Comparator.comparing(Friendship::getRespondedAt, Comparator.nullsLast(Comparator.reverseOrder()))
            .thenComparing(byCreatedDesc);

    accepted.sort(byRespondedDesc);
    incoming.sort(byCreatedDesc);
    outgoing.sort(byCreatedDesc);
    blocked.sort(byRespondedDesc);

    Set<UUID> otherUserIds = new HashSet<>();
    accepted.forEach(f -> otherUserIds.add(f.otherUserId(userId)));
    incoming.forEach(f -> otherUserIds.add(f.getRequesterId()));
    outgoing.forEach(f -> otherUserIds.add(f.getAddresseeId()));
    blocked.forEach(f -> otherUserIds.add(f.getAddresseeId()));

    Map<UUID, User> usersById = new HashMap<>(otherUserIds.size());
    if (!otherUserIds.isEmpty()) {
      userRepository.findAllByIds(otherUserIds).forEach(u -> usersById.put(u.getId(), u));
    }

    Map<UUID, Integer> effectiveStreaks = effectiveStreakResolver.resolveBatch(usersById.values());

    List<FriendConnectionItem> friendItems = mapConnections(
        accepted, userId, SocialRelationshipStatus.FRIENDS, usersById, effectiveStreaks);
    List<FriendConnectionItem> incomingItems = mapConnections(
        incoming, userId, SocialRelationshipStatus.PENDING_RECEIVED, usersById, effectiveStreaks);
    List<FriendConnectionItem> outgoingItems = mapConnections(
        outgoing, userId, SocialRelationshipStatus.PENDING_SENT, usersById, effectiveStreaks);
    List<FriendConnectionItem> blockedItems = mapConnections(
        blocked, userId, SocialRelationshipStatus.BLOCKED_BY_VIEWER, usersById, effectiveStreaks);

    return new FriendsOverviewResult(
        currentUser.getFriendCode(),
        friendItems.size(),
        SendFriendRequestUseCase.MAX_FRIENDS,
        friendItems,
        incomingItems,
        outgoingItems,
        blockedItems);
  }

  private List<FriendConnectionItem> mapConnections(
      List<Friendship> friendships,
      UUID viewerId,
      SocialRelationshipStatus status,
      Map<UUID, User> usersById,
      Map<UUID, Integer> effectiveStreaks) {
    List<FriendConnectionItem> items = new ArrayList<>(friendships.size());
    for (Friendship f : friendships) {
      UUID otherId = f.otherUserId(viewerId);
      User otherUser = usersById.get(otherId);
      if (otherUser == null) {
        continue;
      }
      int streak = effectiveStreaks.getOrDefault(otherId, 0);
      SocialUserSummary summary = SocialUserSummary.fromUserForViewer(otherUser, streak, status);
      items.add(new FriendConnectionItem(
          f.getId(),
          status,
          f.getRespondedAt(),
          f.getCreatedAt(),
          summary));
    }
    return items;
  }
}
