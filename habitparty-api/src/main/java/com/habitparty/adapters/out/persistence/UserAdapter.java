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

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.entities.UserJpaEntity;
import com.habitparty.adapters.out.persistence.mappers.UserMapper;
import com.habitparty.adapters.out.persistence.repository.UserJpaRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.enums.UserRole;
import com.habitparty.infrastructure.CacheConfig;

@Component
public class UserAdapter implements UserRepository {
  private final UserJpaRepository userRepository;
  private final UserMapper userMapper;
  private CacheManager cacheManager;

  public UserAdapter(UserJpaRepository userRepository, UserMapper userMapper) {
    this.userRepository = userRepository;
    this.userMapper = userMapper;
  }

  @Autowired(required = false)
  public void setCacheManager(@Nullable CacheManager cacheManager) {
    this.cacheManager = cacheManager;
  }

  @Override
  @CacheEvict(cacheNames = CacheConfig.USER_TIMEZONES_CACHE, key = "#user.id", condition = "#user != null && #user.id != null")
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
      if (!userRepository.existsByFriendCode(candidate)) {
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
    if (cacheManager != null) {
      Cache tzCache = cacheManager.getCache(CacheConfig.USER_TIMEZONES_CACHE);
      if (tzCache != null) {
        for (User user : users) {
          if (user != null && user.getId() != null) {
            tzCache.evict(user.getId());
          }
        }
      }
    }
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
  @CacheEvict(cacheNames = CacheConfig.USER_TIMEZONES_CACHE, key = "#id", condition = "#id != null")
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
  public Optional<AdminUserStatsSummary> summarizeAdminUserStats() {
    UserJpaRepository.AdminUserStatsProjection stats = userRepository.summarizeAdminUserStats();
    if (stats == null) {
      return Optional.of(new AdminUserStatsSummary(0L, 0L, 0L, 0L, 0L, 0L));
    }
    long total = stats.getTotalUsers();
    long premium = stats.getPremiumUsers() != null ? stats.getPremiumUsers() : 0L;
    long free = Math.max(0L, total - premium);
    long founders = stats.getFounderUsers() != null ? stats.getFounderUsers() : 0L;
    long admins = stats.getAdminUsers() != null ? stats.getAdminUsers() : 0L;
    long verified = stats.getVerifiedUsers() != null ? stats.getVerifiedUsers() : 0L;
    return Optional.of(new AdminUserStatsSummary(total, free, premium, founders, admins, verified));
  }

  @Override
  public Page<User> searchUsers(
      String search,
      UserRole role,
      Boolean isPremium,
      Boolean isFounder,
      Boolean emailVerified,
      Pageable pageable) {
    String searchPattern = (search != null && !search.isBlank())
        ? "%" + escapeLikePattern(search.trim().toLowerCase(Locale.ROOT)) + "%"
        : null;
    return userRepository.searchUsers(searchPattern, role, isPremium, isFounder, emailVerified, pageable)
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
    return userRepository.findByFriendCode(normalized).map(userMapper::toDomain);
  }

  @Override
  public boolean existsByFriendCode(String friendCode) {
    String normalized = User.normalizeFriendCode(friendCode);
    if (normalized == null) {
      return false;
    }
    return userRepository.existsByFriendCode(normalized);
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
    String pattern = "%" + escapeLikePattern(cleanedUsername.toLowerCase(Locale.ROOT)) + "%";
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

  @Override
  @Cacheable(
      cacheNames = CacheConfig.USER_TIMEZONES_CACHE,
      key = "#id",
      condition = "#id != null",
      unless = "#result == null")
  public Optional<String> findTimezoneById(UUID id) {
    if (id == null) {
      return Optional.empty();
    }
    return userRepository.findTimezoneById(id);
  }

  static String escapeLikePattern(String raw) {
    return raw
        .replace("\\", "\\\\")
        .replace("%", "\\%")
        .replace("_", "\\_");
  }
}
