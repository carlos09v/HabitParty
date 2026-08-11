package com.habitparty.adapters.out.persistence.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.habitparty.adapters.out.persistence.entities.UserJpaEntity;

// Herda métodos da lib JpaRepository como save, delete, etc.
public interface UserJpaRepository extends JpaRepository<UserJpaEntity, UUID> {
  Optional<UserJpaEntity> findByEmail(String email);
}
