package com.habitparty.adapters.out.persistence.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.habitparty.adapters.out.persistence.entities.BoardColumnJpaEntity;

public interface BoardColumnJpaRepository extends JpaRepository<BoardColumnJpaEntity, UUID> {
  int countByWorkspace_Id(UUID workspaceId);

  List<BoardColumnJpaEntity> findByWorkspace_Id(UUID workspaceId);
}
