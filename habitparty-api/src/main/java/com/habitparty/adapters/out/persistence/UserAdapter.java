package com.habitparty.adapters.out.persistence;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.entities.UserJpaEntity;
import com.habitparty.adapters.out.persistence.mappers.UserMapper;
import com.habitparty.adapters.out.persistence.repository.UserJpaRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.enums.TransactionType;
import com.habitparty.core.domain.enums.UserRole;

@Component
public class UserAdapter implements UserRepository {
  private final UserJpaRepository userRepository;
  private final UserMapper userMapper;

  public UserAdapter(UserJpaRepository userRepository, UserMapper userMapper) {
    this.userRepository = userRepository;
    this.userMapper = userMapper;
  }

  @Override
  public User save(User user) {
    UserJpaEntity entity = userRepository.findById(user.getId())
        .map(existing -> {
          userMapper.updateEntityFromDomain(existing, user);
          return existing;
        })
        .orElseGet(() -> userMapper.toEntity(user));

    UserJpaEntity savedEntity = userRepository.save(entity);
    return userMapper.toDomain(savedEntity);
  }

  @Override
  public Optional<User> findById(UUID id) {
    return userRepository.findById(id)
        .map(userMapper::toDomain);
  }

  @Override
  public List<User> findAllByIds(Collection<UUID> ids) {
    if (ids == null || ids.isEmpty()) {
      return List.of();
    }
    return userRepository.findAllById(ids).stream()
        .map(userMapper::toDomain)
        .toList();
  }

  @Override
  public Optional<User> findByEmail(String email) {
    return userRepository.findByEmail(email)
        .map(userMapper::toDomain);
  }

  @Override
  public Optional<User> findByUsername(String username) {
    return userRepository.findByUsername(username)
        .map(userMapper::toDomain);
  }

  @Override
  public Optional<User> findByStripeCustomerId(String stripeCustomerId) {
    return userRepository.findByStripeCustomerId(stripeCustomerId)
        .map(userMapper::toDomain);
  }

  @Override
  public void deleteById(UUID id) {
    userRepository.deleteById(id);
  }

  @Override
  public List<User> findAll() {
    return userRepository.findAll().stream()
        .map(userMapper::toDomain)
        .toList();
  }

  @Override
  public long countAll() {
    return userRepository.count();
  }

  @Override
  public long countByIsPremium(boolean isPremium) {
    return userRepository.countByIsPremium(isPremium);
  }

  @Override
  public long countByRole(UserRole role) {
    return userRepository.countByRole(role);
  }

  @Override
  public long countFounders() {
    return userRepository.countByIsFounderTrue();
  }

  @Override
  public long countByEmailVerified(boolean emailVerified) {
    return userRepository.countByEmailVerified(emailVerified);
  }

  @Override
  public Page<User> searchUsers(String search, UserRole role, Boolean isPremium, Boolean isFounder, Boolean emailVerified, Pageable pageable) {
    return userRepository.searchUsers(search, role, isPremium, isFounder, emailVerified, pageable)
        .map(userMapper::toDomain);
  }

  @Override
  public List<User> findUsersWithExpiredStreak(LocalDateTime since) {
    return userRepository.findUsersWithExpiredStreak(TransactionHistoryAdapter.COMPLETED_TASK_TYPES, since).stream()
        .map(userMapper::toDomain)
        .toList();
  }
}
