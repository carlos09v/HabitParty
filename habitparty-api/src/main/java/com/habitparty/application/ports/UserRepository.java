package com.habitparty.application.ports;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.enums.UserRole;

public interface UserRepository {
  User save(User user); // create and update methods
  void deleteById(UUID id);
  Optional<User> findById(UUID id);
  List<User> findAllByIds(Collection<UUID> ids); // Carregamento em lote (evita N+1 em jobs)
  List<User> findAll();
  Optional<User> findByEmail(String email); // Para o LoginUseCase
  Optional<User> findByUsername(String username);
  Optional<User> findByStripeCustomerId(String stripeCustomerId);
  long countAll();
  long countByIsPremium(boolean isPremium);
  long countByRole(UserRole role);
  long countFounders();
  long countByEmailVerified(boolean emailVerified);
  Page<User> searchUsers(String search, UserRole role, Boolean isPremium, Boolean isFounder, Boolean emailVerified, Pageable pageable);

  default List<User> findUsersWithExpiredStreak(LocalDateTime since) {
    return List.of();
  }
}
