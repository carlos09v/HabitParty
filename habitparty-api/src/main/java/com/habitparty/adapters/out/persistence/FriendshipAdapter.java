package com.habitparty.adapters.out.persistence;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.adapters.out.persistence.entities.FriendshipJpaEntity;
import com.habitparty.adapters.out.persistence.mappers.FriendshipMapper;
import com.habitparty.adapters.out.persistence.repository.FriendshipJpaRepository;
import com.habitparty.application.ports.FriendshipRepository;
import com.habitparty.core.domain.entities.social.Friendship;
import com.habitparty.core.domain.enums.FriendshipStatus;

@Component
public class FriendshipAdapter implements FriendshipRepository {

  private final FriendshipJpaRepository repository;
  private final FriendshipMapper mapper;

  public FriendshipAdapter(FriendshipJpaRepository repository, FriendshipMapper mapper) {
    this.repository = repository;
    this.mapper = mapper;
  }

  @Override
  public Optional<Friendship> findById(UUID friendshipId) {
    return repository.findById(friendshipId).map(mapper::toDomain);
  }

  @Override
  public Optional<Friendship> findBetweenUsers(UUID userA, UUID userB) {
    if (userA == null || userB == null) {
      return Optional.empty();
    }
    return repository.findBetweenUsers(userA, userB).map(mapper::toDomain);
  }

  @Override
  public List<Friendship> findAllBetweenUserAndTargets(UUID userId, Collection<UUID> targetIds) {
    if (userId == null || targetIds == null || targetIds.isEmpty()) {
      return List.of();
    }
    return repository.findAllBetweenUserAndTargets(userId, targetIds).stream()
        .map(mapper::toDomain)
        .toList();
  }

  @Override
  public List<Friendship> findAllInvolvingUser(UUID userId) {
    if (userId == null) {
      return List.of();
    }
    return repository.findAllInvolvingUser(userId).stream()
        .map(mapper::toDomain)
        .toList();
  }

  @Override
  public List<Friendship> findAcceptedByUserId(UUID userId) {
    return repository.findAllByUserIdAndStatus(userId, FriendshipStatus.ACCEPTED).stream()
        .map(mapper::toDomain)
        .toList();
  }

  @Override
  public List<Friendship> findIncomingPendingByUserId(UUID userId) {
    return repository.findByAddresseeIdAndStatusOrderByCreatedAtDesc(userId, FriendshipStatus.PENDING)
        .stream()
        .map(mapper::toDomain)
        .toList();
  }

  @Override
  public List<Friendship> findOutgoingPendingByUserId(UUID userId) {
    return repository.findByRequesterIdAndStatusOrderByCreatedAtDesc(userId, FriendshipStatus.PENDING)
        .stream()
        .map(mapper::toDomain)
        .toList();
  }

  @Override
  public List<Friendship> findBlockedByBlockerId(UUID blockerId) {
    return repository.findByRequesterIdAndStatusOrderByRespondedAtDesc(blockerId, FriendshipStatus.BLOCKED)
        .stream()
        .map(mapper::toDomain)
        .toList();
  }

  @Override
  public List<UUID> findAcceptedFriendIds(UUID userId) {
    return findAcceptedByUserId(userId).stream()
        .map(friendship -> friendship.otherUserId(userId))
        .toList();
  }

  @Override
  public long countAcceptedByUserId(UUID userId) {
    return repository.countByUserIdAndStatus(userId, FriendshipStatus.ACCEPTED);
  }

  @Override
  @Transactional
  public Friendship save(Friendship friendship) {
    FriendshipJpaEntity saved = repository.save(mapper.toEntity(friendship));
    return mapper.toDomain(saved);
  }

  @Override
  @Transactional
  public void delete(Friendship friendship) {
    if (friendship != null && friendship.getId() != null) {
      repository.deleteById(friendship.getId());
    }
  }

  @Override
  @Transactional
  public void deleteAllByUserId(UUID userId) {
    repository.deleteAllByUserId(userId);
  }
}
