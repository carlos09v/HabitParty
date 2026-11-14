package com.habitparty.adapters.out.persistence;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
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
    if (user.getFriendCode() == null || user.getFriendCode().isBlank()) {
      user.setFriendCode(generateUniqueFriendCode());
    }
    UserJpaEntity entity = userRepository.findById(user.getId())
        .map(existing -> {
          userMapper.updateEntityFromDomain(existing, user);
          return existing;
        })
        .orElseGet(() -> userMapper.toEntity(user));

    UserJpaEntity savedEntity = userRepository.save(entity);
    return userMapper.toDomain(savedEntity);
  }

  private String generateUniqueFriendCode() {
    for (int attempt = 0; attempt < 10; attempt++) {
      String candidate = User.generateRandomFriendCode();
      if (!userRepository.existsByFriendCodeIgnoreCase(candidate)) {
        return candidate;
      }
    }
    return User.generateRandomFriendCode();
  }

  @Override
  public void saveAll(Collection<User> users) {
    if (users == null || users.isEmpty()) {
      return;
    }

    List<UUID> existingIds = users.stream()
        .map(User::getId)
        .filter(Objects::nonNull)
        .toList();

    Map<UUID, UserJpaEntity> existingById = existingIds.isEmpty()
        ? Map.of()
        : userRepository.findAllById(existingIds).stream()
            .collect(Collectors.toMap(
                UserJpaEntity::getId,
                Function.identity(),
                (a, b) -> a));

    List<UserJpaEntity> entitiesToSave = new ArrayList<>(users.size());
    for (User user : users) {
      if (user.getFriendCode() == null || user.getFriendCode().isBlank()) {
        user.setFriendCode(generateUniqueFriendCode());
      }
      UserJpaEntity entity = user.getId() != null ? existingById.get(user.getId()) : null;
      if (entity != null) {
        userMapper.updateEntityFromDomain(entity, user);
      } else {
        entity = userMapper.toEntity(user);
      }
      entitiesToSave.add(entity);
    }

    userRepository.saveAll(entitiesToSave);
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
  public Optional<User> findByIdForUpdate(UUID id) {
    return userRepository.findByIdForUpdate(id)
        .map(userMapper::toDomain);
  }

  @Override
  public List<User> findAllByIdsForUpdate(Collection<UUID> ids) {
    if (ids == null || ids.isEmpty()) {
      return List.of();
    }
    return userRepository.findAllByIdInForUpdate(ids).stream()
        .map(userMapper::toDomain)
        .toList();
  }

  @Override
  public boolean isUserDueForDailyReset(UUID id, Instant nowUtc) {
    if (id == null) {
      return false;
    }
    return userRepository.isUserDueForDailyReset(id, nowUtc);
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
  public Optional<User> findByUsernameIgnoreCase(String username) {
    if (username == null || username.isBlank()) {
      return Optional.empty();
    }
    return userRepository.findByUsernameIgnoreCase(username.trim())
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

  @Override
  public List<UUID> findUserIdsDueForDailyReset(Instant nowUtc) {
    return userRepository.findUserIdsDueForDailyReset(nowUtc);
  }

  @Override
  public Optional<User> findByFriendCode(String friendCode) {
    String normalized = User.normalizeFriendCode(friendCode);
    if (normalized == null) {
      return Optional.empty();
    }
    return userRepository.findByFriendCodeIgnoreCase(normalized).map(userMapper::toDomain);
  }

  @Override
  public boolean existsByFriendCode(String friendCode) {
    String normalized = User.normalizeFriendCode(friendCode);
    if (normalized == null) {
      return false;
    }
    return userRepository.existsByFriendCodeIgnoreCase(normalized);
  }

  @Override
  public List<User> searchSocialUsers(String query, UUID excludeUserId, int limit) {
    if (query == null || query.isBlank() || excludeUserId == null) {
      return List.of();
    }
    String trimmed = query.trim();
    String cleanedUsername = trimmed.startsWith("@") ? trimmed.substring(1).trim() : trimmed;
    if (cleanedUsername.isEmpty()) {
      return List.of();
    }
    String exactCode = !trimmed.startsWith("@") ? User.normalizeFriendCode(trimmed) : null;
    String pattern = "%" + cleanedUsername.toLowerCase(Locale.ROOT) + "%";
    int safeLimit = Math.max(1, Math.min(limit, 30));
    return userRepository.searchSocialUsers(
            excludeUserId,
            exactCode != null ? exactCode : "",
            pattern,
            PageRequest.of(0, safeLimit))
        .stream()
        .map(userMapper::toDomain)
        .toList();
  }
}
