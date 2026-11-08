package com.habitparty.adapters.out.persistence.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.habitparty.adapters.out.persistence.entities.ProfileHighlightJpaEntity;

public interface ProfileHighlightJpaRepository extends JpaRepository<ProfileHighlightJpaEntity, UUID> {
  List<ProfileHighlightJpaEntity> findAllByUserIdOrderByDisplayOrderAsc(UUID userId);

  long countByUserId(UUID userId);

  @Modifying
  @Query("DELETE FROM ProfileHighlightJpaEntity ph WHERE ph.userId = :userId")
  void deleteAllByUserId(@Param("userId") UUID userId);
}
