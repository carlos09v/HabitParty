package com.habitparty.adapters.out.persistence.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.habitparty.adapters.out.persistence.entities.RefreshTokenJpaEntity;

public interface RefreshTokenJpaRepository extends JpaRepository<RefreshTokenJpaEntity, UUID> {
  Optional<RefreshTokenJpaEntity> findByToken(String token);
}
