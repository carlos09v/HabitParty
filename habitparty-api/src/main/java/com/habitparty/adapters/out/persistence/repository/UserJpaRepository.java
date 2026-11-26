package com.habitparty.adapters.out.persistence.repository;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.habitparty.adapters.out.persistence.entities.UserJpaEntity;
import com.habitparty.core.domain.enums.TransactionType;
import com.habitparty.core.domain.enums.UserRole;

import jakarta.persistence.LockModeType;

public interface UserJpaRepository extends JpaRepository<UserJpaEntity, UUID> {

  @Override
  @EntityGraph(attributePaths = {"stats", "subscription"})
  Optional<UserJpaEntity> findById(UUID id);

  @Override
  @EntityGraph(attributePaths = {"stats", "subscription"})
  List<UserJpaEntity> findAllById(Iterable<UUID> ids);

  @Override
  @EntityGraph(attributePaths = {"stats", "subscription"})
  List<UserJpaEntity> findAll();

  @EntityGraph(attributePaths = {"stats", "subscription"})
  Optional<UserJpaEntity> findByEmail(String email);

  @EntityGraph(attributePaths = {"stats", "subscription"})
  Optional<UserJpaEntity> findByUsername(String username);

  @EntityGraph(attributePaths = {"stats", "subscription"})
  Optional<UserJpaEntity> findByUsernameIgnoreCase(String username);

  @EntityGraph(attributePaths = {"stats", "subscription"})
  @Query("SELECT u FROM UserJpaEntity u LEFT JOIN u.subscription s WHERE s.stripeCustomerId = :stripeCustomerId")
  Optional<UserJpaEntity> findByStripeCustomerId(@Param("stripeCustomerId") String stripeCustomerId);

  long countByRole(UserRole role);

  // Alinhado exatamente à regra de UserSubscription.isPremium() (incluindo saldo pré-pago Pix e exclusão de PAST_DUE)
  @Query("""
      SELECT COUNT(u) FROM UserJpaEntity u
      LEFT JOIN u.subscription s
      WHERE (
        :isPremium = true
        AND s IS NOT NULL
        AND (
          (s.prepaidEndsAt IS NOT NULL AND s.prepaidEndsAt > CURRENT_TIMESTAMP)
          OR (
            s.subscriptionStatus <> com.habitparty.core.domain.enums.SubscriptionStatus.PAST_DUE
            AND (
              (s.subscriptionEndsAt IS NOT NULL AND s.subscriptionEndsAt > CURRENT_TIMESTAMP)
              OR (s.subscriptionEndsAt IS NULL AND s.subscriptionStatus = com.habitparty.core.domain.enums.SubscriptionStatus.ACTIVE)
              OR (s.subscriptionEndsAt IS NULL AND s.isPremium = true AND (s.subscriptionStatus IS NULL OR s.subscriptionStatus = com.habitparty.core.domain.enums.SubscriptionStatus.FREE))
            )
          )
        )
      )
      OR (
        :isPremium = false
        AND (
          s IS NULL
          OR (
            (s.prepaidEndsAt IS NULL OR s.prepaidEndsAt <= CURRENT_TIMESTAMP)
            AND (
              s.subscriptionStatus = com.habitparty.core.domain.enums.SubscriptionStatus.PAST_DUE
              OR (s.subscriptionEndsAt IS NOT NULL AND s.subscriptionEndsAt <= CURRENT_TIMESTAMP)
              OR (
                s.subscriptionEndsAt IS NULL
                AND s.subscriptionStatus <> com.habitparty.core.domain.enums.SubscriptionStatus.ACTIVE
                AND NOT (s.isPremium = true AND (s.subscriptionStatus IS NULL OR s.subscriptionStatus = com.habitparty.core.domain.enums.SubscriptionStatus.FREE))
              )
            )
          )
        )
      )
      """)
  long countByIsPremium(@Param("isPremium") boolean isPremium);

  @Query("SELECT COUNT(u) FROM UserJpaEntity u LEFT JOIN u.subscription s WHERE s.isFounder = true")
  long countByIsFounderTrue();

  long countByEmailVerified(boolean emailVerified);

  interface AdminUserStatsProjection {
    long getTotalUsers();
    Long getPremiumUsers();
    Long getFounderUsers();
    Long getAdminUsers();
    Long getVerifiedUsers();
  }

  @Query("""
      SELECT COUNT(u) AS totalUsers,
             COALESCE(SUM(CASE WHEN s IS NOT NULL AND (
               (s.prepaidEndsAt IS NOT NULL AND s.prepaidEndsAt > CURRENT_TIMESTAMP)
               OR (
                 s.subscriptionStatus <> com.habitparty.core.domain.enums.SubscriptionStatus.PAST_DUE
                 AND (
                   (s.subscriptionEndsAt IS NOT NULL AND s.subscriptionEndsAt > CURRENT_TIMESTAMP)
                   OR (s.subscriptionEndsAt IS NULL AND s.subscriptionStatus = com.habitparty.core.domain.enums.SubscriptionStatus.ACTIVE)
                   OR (s.subscriptionEndsAt IS NULL AND s.isPremium = true AND (s.subscriptionStatus IS NULL OR s.subscriptionStatus = com.habitparty.core.domain.enums.SubscriptionStatus.FREE))
                 )
               )
             ) THEN 1L ELSE 0L END), 0L) AS premiumUsers,
             COALESCE(SUM(CASE WHEN s IS NOT NULL AND s.isFounder = true THEN 1L ELSE 0L END), 0L) AS founderUsers,
             COALESCE(SUM(CASE WHEN u.role = com.habitparty.core.domain.enums.UserRole.ADMIN THEN 1L ELSE 0L END), 0L) AS adminUsers,
             COALESCE(SUM(CASE WHEN u.emailVerified = true THEN 1L ELSE 0L END), 0L) AS verifiedUsers
      FROM UserJpaEntity u
      LEFT JOIN u.subscription s
      """)
  AdminUserStatsProjection summarizeAdminUserStats();

  @EntityGraph(attributePaths = {"stats", "subscription"})
  @Query("""
      SELECT u FROM UserJpaEntity u
      LEFT JOIN u.subscription s
      WHERE (CAST(:searchPattern AS string) IS NULL
             OR LOWER(u.fullName) LIKE CAST(:searchPattern AS string) ESCAPE '\\'
             OR LOWER(u.email) LIKE CAST(:searchPattern AS string) ESCAPE '\\'
             OR LOWER(u.username) LIKE CAST(:searchPattern AS string) ESCAPE '\\')
        AND (:role IS NULL OR u.role = :role)
        AND (:isPremium IS NULL
             OR (
               :isPremium = true
               AND s IS NOT NULL
               AND (
                 (s.prepaidEndsAt IS NOT NULL AND s.prepaidEndsAt > CURRENT_TIMESTAMP)
                 OR (
                   s.subscriptionStatus <> com.habitparty.core.domain.enums.SubscriptionStatus.PAST_DUE
                   AND (
                     (s.subscriptionEndsAt IS NOT NULL AND s.subscriptionEndsAt > CURRENT_TIMESTAMP)
                     OR (s.subscriptionEndsAt IS NULL AND s.subscriptionStatus = com.habitparty.core.domain.enums.SubscriptionStatus.ACTIVE)
                     OR (s.subscriptionEndsAt IS NULL AND s.isPremium = true AND (s.subscriptionStatus IS NULL OR s.subscriptionStatus = com.habitparty.core.domain.enums.SubscriptionStatus.FREE))
                   )
                 )
               )
             )
             OR (
               :isPremium = false
               AND (
                 s IS NULL
                 OR (
                   (s.prepaidEndsAt IS NULL OR s.prepaidEndsAt <= CURRENT_TIMESTAMP)
                   AND (
                     s.subscriptionStatus = com.habitparty.core.domain.enums.SubscriptionStatus.PAST_DUE
                     OR (s.subscriptionEndsAt IS NOT NULL AND s.subscriptionEndsAt <= CURRENT_TIMESTAMP)
                     OR (
                       s.subscriptionEndsAt IS NULL
                       AND s.subscriptionStatus <> com.habitparty.core.domain.enums.SubscriptionStatus.ACTIVE
                       AND NOT (s.isPremium = true AND (s.subscriptionStatus IS NULL OR s.subscriptionStatus = com.habitparty.core.domain.enums.SubscriptionStatus.FREE))
                     )
                   )
                 )
               )
             ))
        AND (:isFounder IS NULL
             OR (:isFounder = true AND s.isFounder = true)
             OR (:isFounder = false AND (s IS NULL OR s.isFounder = false)))
        AND (:emailVerified IS NULL OR u.emailVerified = :emailVerified)
      ORDER BY u.createdAt DESC
      """)
  Page<UserJpaEntity> searchUsers(
      @Param("searchPattern") String searchPattern,
      @Param("role") UserRole role,
      @Param("isPremium") Boolean isPremium,
      @Param("isFounder") Boolean isFounder,
      @Param("emailVerified") Boolean emailVerified,
      Pageable pageable);

  @EntityGraph(attributePaths = {"stats", "subscription"})
  @Query("""
      SELECT u FROM UserJpaEntity u
      JOIN u.stats st
      WHERE st.currentStreak > 0
        AND NOT EXISTS (
          SELECT 1 FROM TransactionHistoryJpaEntity t
          WHERE t.userId = u.id
            AND t.transactionType IN :completedTypes
            AND t.createdAt >= :since
        )
      """)
  List<UserJpaEntity> findUsersWithExpiredStreak(
      @Param("completedTypes") Collection<TransactionType> completedTypes,
      @Param("since") LocalDateTime since);

  @Query("""
      SELECT u.id FROM UserJpaEntity u
      WHERE u.nextDailyResetAt IS NULL OR u.nextDailyResetAt <= :nowUtc
      ORDER BY u.id ASC
      """)
  List<UUID> findUserIdsDueForDailyReset(@Param("nowUtc") Instant nowUtc);

  @Query("""
      SELECT EXISTS (
        SELECT 1 FROM UserJpaEntity u
        WHERE u.id = :id AND (u.nextDailyResetAt IS NULL OR u.nextDailyResetAt <= :nowUtc)
      )
      """)
  boolean isUserDueForDailyReset(@Param("id") UUID id, @Param("nowUtc") Instant nowUtc);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("SELECT u FROM UserJpaEntity u WHERE u.id = :id")
  Optional<UserJpaEntity> findByIdForUpdate(@Param("id") UUID id);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("SELECT u FROM UserJpaEntity u WHERE u.id IN :ids ORDER BY u.id ASC")
  List<UserJpaEntity> findAllByIdInForUpdate(@Param("ids") Collection<UUID> ids);

  @EntityGraph(attributePaths = {"stats", "subscription"})
  Optional<UserJpaEntity> findByFriendCode(String friendCode);

  boolean existsByFriendCode(String friendCode);

  @EntityGraph(attributePaths = {"stats", "subscription"})
  @Query("""
      SELECT u FROM UserJpaEntity u
      WHERE u.id <> :excludeUserId
        AND (
          (u.friendCode = :exactCode
            AND (u.profileVisibility <> com.habitparty.core.domain.enums.PrivacyLevel.PRIVATE
                 OR u.friendRequestPolicy <> com.habitparty.core.domain.enums.FriendRequestPolicy.NONE))
          OR (
            u.profileVisibility <> com.habitparty.core.domain.enums.PrivacyLevel.PRIVATE
            AND (
              LOWER(u.username) LIKE :pattern ESCAPE '\\'
              OR LOWER(u.fullName) LIKE :pattern ESCAPE '\\'
            )
          )
        )
      ORDER BY CASE WHEN u.friendCode = :exactCode THEN 0 ELSE 1 END,
               u.username ASC
      """)
  List<UserJpaEntity> searchSocialUsers(
      @Param("excludeUserId") UUID excludeUserId,
      @Param("exactCode") String exactCode,
      @Param("pattern") String pattern,
      Pageable pageable);

  @Query("SELECT u.timezone FROM UserJpaEntity u WHERE u.id = :id")
  Optional<String> findTimezoneById(@Param("id") UUID id);
}
