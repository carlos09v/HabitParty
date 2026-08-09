package com.habitparty.adapters.out.persistence.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.habitparty.adapters.out.persistence.entities.WorkspaceJpaEntity;

// Herda métodos da lib JpaRepository como save, delete, etc.
public interface WorkspaceJpaRepository extends JpaRepository<WorkspaceJpaEntity, UUID> {
  // O Spring cria o comando SQL "SELECT COUNT(*) FROM workspaces WHERE user_id = ?"!
  int countByUser_Id(UUID userId);
  
  List<WorkspaceJpaEntity> findByUser_Id(UUID userId);
}
