package com.habitparty.adapters.out.persistence.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.habitparty.adapters.out.persistence.entities.ChecklistItemJpaEntity;

public interface ChecklistItemJpaRepository extends JpaRepository<ChecklistItemJpaEntity, UUID> {
    // Aquele atalho de performance incrível que discutimos!
    Optional<ChecklistItemJpaEntity> findByIdAndUserId(UUID id, UUID userId);
}
