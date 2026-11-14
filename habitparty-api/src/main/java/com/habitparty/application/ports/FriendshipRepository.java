package com.habitparty.application.ports;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.habitparty.core.domain.entities.social.Friendship;

public interface FriendshipRepository {
  Optional<Friendship> findById(UUID friendshipId);

  Optional<Friendship> findBetweenUsers(UUID userA, UUID userB);

  default List<Friendship> findAllBetweenUserAndTargets(UUID userId, Collection<UUID> targetIds) {
    if (userId == null || targetIds == null || targetIds.isEmpty()) {
      return List.of();
    }
    return targetIds.stream()
        .map(targetId -> findBetweenUsers(userId, targetId))
        .flatMap(Optional::stream)
        .toList();
  }

  default List<Friendship> findAllInvolvingUser(UUID userId) {
    return List.of();
  }

  List<Friendship> findAcceptedByUserId(UUID userId);

  List<Friendship> findIncomingPendingByUserId(UUID userId);

  List<Friendship> findOutgoingPendingByUserId(UUID userId);

  default List<Friendship> findBlockedByBlockerId(UUID blockerId) {
    return List.of();
  }

  List<UUID> findAcceptedFriendIds(UUID userId);

  long countAcceptedByUserId(UUID userId);

  Friendship save(Friendship friendship);

  void delete(Friendship friendship);

  void deleteAllByUserId(UUID userId);
}
