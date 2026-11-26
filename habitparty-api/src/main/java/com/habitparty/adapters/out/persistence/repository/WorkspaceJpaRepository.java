package com.habitparty.adapters.out.persistence.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.habitparty.adapters.out.persistence.entities.WorkspaceJpaEntity;

public interface WorkspaceJpaRepository extends JpaRepository<WorkspaceJpaEntity, UUID> {

  int countByUserId(UUID userId);

  List<WorkspaceJpaEntity> findByUserIdOrderByCreatedAtAsc(UUID userId);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query("DELETE FROM WorkspaceJpaEntity w WHERE w.userId = :userId")
  void deleteAllByUserId(@Param("userId") UUID userId);
}
