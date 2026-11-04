package com.habitparty.adapters.out.persistence.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.habitparty.adapters.out.persistence.entities.UserJpaEntity;
import com.habitparty.core.domain.enums.UserRole;

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
  @Query("SELECT u FROM UserJpaEntity u LEFT JOIN u.subscription s WHERE s.stripeCustomerId = :stripeCustomerId")
  Optional<UserJpaEntity> findByStripeCustomerId(@Param("stripeCustomerId") String stripeCustomerId);

  long countByRole(UserRole role);

  @Query("""
      SELECT COUNT(u) FROM UserJpaEntity u
      LEFT JOIN u.subscription s
      WHERE (:isPremium = true AND s.isPremium = true AND (s.subscriptionEndsAt IS NULL OR s.subscriptionEndsAt > CURRENT_TIMESTAMP))
         OR (:isPremium = false AND (s IS NULL OR s.isPremium = false OR (s.subscriptionEndsAt IS NOT NULL AND s.subscriptionEndsAt <= CURRENT_TIMESTAMP)))
  """)
  long countByIsPremium(@Param("isPremium") boolean isPremium);

  @Query("SELECT COUNT(u) FROM UserJpaEntity u LEFT JOIN u.subscription s WHERE s.isFounder = true")
  long countByIsFounderTrue();

  long countByEmailVerified(boolean emailVerified);

  @EntityGraph(attributePaths = {"stats", "subscription"})
  @Query("""
      SELECT u FROM UserJpaEntity u
      LEFT JOIN u.subscription s
      WHERE (CAST(:search AS string) IS NULL
             OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
             OR LOWER(u.email) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
             OR LOWER(u.username) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))
        AND (:role IS NULL OR u.role = :role)
        AND (:isPremium IS NULL
             OR (:isPremium = true AND s.isPremium = true AND (s.subscriptionEndsAt IS NULL OR s.subscriptionEndsAt > CURRENT_TIMESTAMP))
             OR (:isPremium = false AND (s IS NULL OR s.isPremium = false OR (s.subscriptionEndsAt IS NOT NULL AND s.subscriptionEndsAt <= CURRENT_TIMESTAMP))))
        AND (:isFounder IS NULL OR s.isFounder = :isFounder)
        AND (:emailVerified IS NULL OR u.emailVerified = :emailVerified)
      ORDER BY u.createdAt DESC
  """)
  Page<UserJpaEntity> searchUsers(
      @Param("search") String search,
      @Param("role") UserRole role,
      @Param("isPremium") Boolean isPremium,
      @Param("isFounder") Boolean isFounder,
      @Param("emailVerified") Boolean emailVerified,
      Pageable pageable
  );
}
