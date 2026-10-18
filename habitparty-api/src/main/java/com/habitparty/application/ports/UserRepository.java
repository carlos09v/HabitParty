package com.habitparty.application.ports;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.habitparty.core.domain.entities.User;

public interface UserRepository {
  User save(User user); // create and update methods
  void deleteById(UUID id);
  Optional<User> findById(UUID id);
  List<User> findAll();
  Optional<User> findByEmail(String email); // Para o LoginUseCase
  Optional<User> findByUsername(String username);
  Optional<User> findByStripeCustomerId(String stripeCustomerId);
  long countFounders();
}


