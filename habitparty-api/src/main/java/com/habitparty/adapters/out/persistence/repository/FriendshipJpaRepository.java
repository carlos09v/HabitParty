package com.habitparty.adapters.out.persistence.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.habitparty.adapters.out.persistence.entities.FriendshipJpaEntity;
import com.habitparty.core.domain.enums.FriendshipStatus;

@Repository
public interface FriendshipJpaRepository extends JpaRepository<FriendshipJpaEntity, UUID> {

  @Query("""
      SELECT f FROM FriendshipJpaEntity f
      WHERE (f.requesterId = :userA AND f.addresseeId = :userB)
         OR (f.requesterId = :userB AND f.addresseeId = :userA)
      """)
  Optional<FriendshipJpaEntity> findBetweenUsers(@Param("userA") UUID userA, @Param("userB") UUID userB);

  @Query("""
      SELECT f FROM FriendshipJpaEntity f
      WHERE (f.requesterId = :userId AND f.addresseeId IN :targetIds)
         OR (f.addresseeId = :userId AND f.requesterId IN :targetIds)
      """)
  List<FriendshipJpaEntity> findAllBetweenUserAndTargets(
      @Param("userId") UUID userId,
      @Param("targetIds") Collection<UUID> targetIds);

  @Query("""
      SELECT f FROM FriendshipJpaEntity f
      WHERE f.requesterId = :userId OR f.addresseeId = :userId
      ORDER BY f.respondedAt DESC, f.createdAt DESC
      """)
  List<FriendshipJpaEntity> findAllInvolvingUser(@Param("userId") UUID userId);

  @Query("""
      SELECT f FROM FriendshipJpaEntity f
      WHERE f.status = :status
        AND (f.requesterId = :userId OR f.addresseeId = :userId)
      ORDER BY f.respondedAt DESC, f.createdAt DESC
      """)
  List<FriendshipJpaEntity> findAllByUserIdAndStatus(
      @Param("userId") UUID userId,
      @Param("status") FriendshipStatus status);

  List<FriendshipJpaEntity> findByAddresseeIdAndStatusOrderByCreatedAtDesc(
      UUID addresseeId,
      FriendshipStatus status);

  List<FriendshipJpaEntity> findByRequesterIdAndStatusOrderByCreatedAtDesc(
      UUID requesterId,
      FriendshipStatus status);

  List<FriendshipJpaEntity> findByRequesterIdAndStatusOrderByRespondedAtDesc(
      UUID requesterId,
      FriendshipStatus status);

  @Query("""
      SELECT COUNT(f) FROM FriendshipJpaEntity f
      WHERE f.status = :status
        AND (f.requesterId = :userId OR f.addresseeId = :userId)
      """)
  long countByUserIdAndStatus(@Param("userId") UUID userId, @Param("status") FriendshipStatus status);

  long countByAddresseeIdAndStatus(UUID addresseeId, FriendshipStatus status);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query("DELETE FROM FriendshipJpaEntity f WHERE f.requesterId = :userId OR f.addresseeId = :userId")
  void deleteAllByUserId(@Param("userId") UUID userId);
}
