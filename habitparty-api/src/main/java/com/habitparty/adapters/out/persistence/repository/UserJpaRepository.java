package com.habitparty.adapters.out.persistence.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.habitparty.adapters.out.persistence.entities.UserJpaEntity;
import com.habitparty.core.domain.enums.UserRole;

// Herda métodos da lib JpaRepository como save, delete, etc.
public interface UserJpaRepository extends JpaRepository<UserJpaEntity, UUID> {
  Optional<UserJpaEntity> findByEmail(String email);
  Optional<UserJpaEntity> findByUsername(String username);
  Optional<UserJpaEntity> findByStripeCustomerId(String stripeCustomerId);

  long countByRole(UserRole role);
  long countByIsPremium(boolean isPremium);
  long countByIsFounderTrue();

  @Query("""
      SELECT u FROM UserJpaEntity u
      WHERE (CAST(:search AS string) IS NULL
             OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
             OR LOWER(u.email) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
             OR LOWER(u.username) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))
        AND (:role IS NULL OR u.role = :role)
        AND (:isPremium IS NULL OR u.isPremium = :isPremium)
        AND (:isFounder IS NULL OR u.isFounder = :isFounder)
      ORDER BY u.createdAt DESC
  """)
  Page<UserJpaEntity> searchUsers(
      @Param("search") String search,
      @Param("role") UserRole role,
      @Param("isPremium") Boolean isPremium,
      @Param("isFounder") Boolean isFounder,
      Pageable pageable
  );
}
