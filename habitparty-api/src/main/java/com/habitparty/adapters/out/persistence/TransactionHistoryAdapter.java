package com.habitparty.adapters.out.persistence;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import jakarta.persistence.criteria.Predicate;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.entities.TransactionHistoryJpaEntity;
import com.habitparty.adapters.out.persistence.mappers.TransactionHistoryMapper;
import com.habitparty.adapters.out.persistence.repository.TransactionHistoryJpaRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.core.domain.entities.TransactionHistory;
import com.habitparty.core.domain.enums.TransactionType;

@Component
public class TransactionHistoryAdapter implements TransactionHistoryRepository {
  public static final List<TransactionType> COMPLETED_TASK_TYPES = List.of(
      TransactionType.HABIT_COMPLETED,
      TransactionType.DAILY_COMPLETED,
      TransactionType.TODO_COMPLETED,
      TransactionType.TASK_COMPLETED
  );

  private static final LocalTime END_OF_DAY_TIME = LocalTime.of(23, 59, 59, 999999999);

  private final TransactionHistoryJpaRepository repository;
  private final TransactionHistoryMapper mapper;
  private final Clock clock;

  @Autowired
  public TransactionHistoryAdapter(
      TransactionHistoryJpaRepository repository,
      TransactionHistoryMapper mapper,
      Clock clock) {
    this.repository = repository;
    this.mapper = mapper;
    this.clock = clock != null ? clock : Clock.systemDefaultZone();
  }

  public TransactionHistoryAdapter(
      TransactionHistoryJpaRepository repository,
      TransactionHistoryMapper mapper) {
    this(repository, mapper, Clock.systemDefaultZone());
  }

  private ZoneId resolveZone(ZoneId userZone) {
    return userZone != null ? userZone : clock.getZone();
  }

  private LocalDateTime toStorageDateTime(LocalDate businessDate, LocalTime businessTime, ZoneId userZone) {
    return businessDate.atTime(businessTime)
        .atZone(resolveZone(userZone))
        .withZoneSameInstant(ZoneId.systemDefault())
        .toLocalDateTime();
  }

  @Override
  public int countCompletedTasksToday(UUID userId) {
    return countCompletedTasksToday(userId, clock.getZone());
  }

  @Override
  public int countCompletedTasksToday(UUID userId, ZoneId userZone) {
    ZoneId effectiveZone = resolveZone(userZone);
    LocalDate today = LocalDate.now(clock.withZone(effectiveZone));
    LocalDateTime startOfDay = toStorageDateTime(today, LocalTime.MIN, effectiveZone);
    LocalDateTime endOfDay = toStorageDateTime(today, END_OF_DAY_TIME, effectiveZone);

    long count = repository.countByUser_IdAndTransactionTypeInAndCreatedAtBetween(
        userId,
        COMPLETED_TASK_TYPES,
        startOfDay,
        endOfDay
    );

    return (int) count;
  }

  @Override
  public boolean hasCompletedTasksYesterday(UUID userId) {
    return hasCompletedTasksYesterday(userId, clock.getZone());
  }

  @Override
  public boolean hasCompletedTasksYesterday(UUID userId, ZoneId userZone) {
    ZoneId effectiveZone = resolveZone(userZone);
    LocalDate yesterday = LocalDate.now(clock.withZone(effectiveZone)).minusDays(1);
    LocalDateTime startOfYesterday = toStorageDateTime(yesterday, LocalTime.MIN, effectiveZone);
    LocalDateTime endOfYesterday = toStorageDateTime(yesterday, END_OF_DAY_TIME, effectiveZone);

    return repository.countByUser_IdAndTransactionTypeInAndCreatedAtBetween(
        userId,
        COMPLETED_TASK_TYPES,
        startOfYesterday,
        endOfYesterday
    ) > 0;
  }

  @Override
  public boolean hasCompletedTasksSinceYesterday(UUID userId) {
    return hasCompletedTasksSinceYesterday(userId, clock.getZone());
  }

  @Override
  public boolean hasCompletedTasksSinceYesterday(UUID userId, ZoneId userZone) {
    ZoneId effectiveZone = resolveZone(userZone);
    LocalDate yesterday = LocalDate.now(clock.withZone(effectiveZone)).minusDays(1);
    LocalDateTime sinceYesterday = toStorageDateTime(yesterday, LocalTime.MIN, effectiveZone);
    return repository.existsByUser_IdAndTransactionTypeInAndCreatedAtGreaterThanEqual(
        userId,
        COMPLETED_TASK_TYPES,
        sinceYesterday
    );
  }

  @Override
  public java.util.Map<UUID, LocalDateTime> findLastCompletedTaskAtByUserIds(java.util.Collection<UUID> userIds, LocalDateTime since) {
    if (userIds == null || userIds.isEmpty()) {
      return java.util.Map.of();
    }
    java.util.Map<UUID, LocalDateTime> result = new java.util.HashMap<>();
    for (Object[] row : repository.findLastCompletedTaskAtByUserIds(userIds, COMPLETED_TASK_TYPES, since)) {
      if (row != null && row.length >= 2 && row[0] instanceof UUID uid && row[1] instanceof LocalDateTime dt) {
        result.put(uid, dt);
      }
    }
    return result;
  }

  @Override
  public void save(TransactionHistory transaction) {
    repository.save(mapper.toEntity(transaction));
  }

  @Override
  public Optional<TransactionHistory> findById(UUID id) {
    return repository.findById(id).map(mapper::toDomain);
  }

  @Override
  public void deleteById(UUID id) {
    repository.deleteById(id);
  }

  @Override
  public void deleteAllByUserId(UUID userId) {
    repository.deleteAllByUserId(userId);
  }

  @Override
  public int deleteAllByIdsAndUserId(List<UUID> ids, UUID userId) {
    if (ids == null || ids.isEmpty()) {
      return 0;
    }
    return repository.deleteAllByIdInAndUserId(ids, userId);
  }

  @Override
  public void deleteAllByReferenceIdAndUserId(UUID referenceId, UUID userId) {
    if (referenceId == null) {
      return;
    }
    repository.deleteAllByReferenceIdInAndUserId(List.of(referenceId), userId);
  }

  @Override
  public void deleteAllByReferenceIdsAndUserId(List<UUID> referenceIds, UUID userId) {
    if (referenceIds == null || referenceIds.isEmpty()) {
      return;
    }
    repository.deleteAllByReferenceIdInAndUserId(referenceIds, userId);
  }

  @Override
  public boolean existsByReferenceIdAndUserId(UUID referenceId, UUID userId) {
    if (referenceId == null || userId == null) {
      return false;
    }
    return repository.existsByReferenceIdAndUserId(referenceId, userId);
  }

  @Override
  public Page<TransactionHistory> findAllByUserId(UUID userId, int page, int size) {
    return repository.findAllByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size))
        .map(mapper::toDomain);
  }

  @Override
  public Page<TransactionHistory> findAllByUserIdAndTypes(
      UUID userId, List<TransactionType> types, int page, int size) {
    return repository.findAllByUserIdAndTransactionTypeInOrderByCreatedAtDesc(
            userId, types, PageRequest.of(page, size))
        .map(mapper::toDomain);
  }

  @Override
  public Page<TransactionHistory> findFiltered(
      UUID userId, List<TransactionType> types, LocalDateTime startDate, String search, int page, int size) {
    Specification<TransactionHistoryJpaEntity> spec = (root, query, cb) -> {
      List<Predicate> predicates = new ArrayList<>();
      predicates.add(cb.equal(root.get("user").get("id"), userId));

      if (types != null && !types.isEmpty()) {
        predicates.add(root.get("transactionType").in(types));
      }

      if (startDate != null) {
        predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDate));
      }

      if (search != null && !search.trim().isEmpty()) {
        String pattern = "%" + search.trim().toLowerCase() + "%";
        predicates.add(cb.like(cb.lower(root.get("nameSnapshot")), pattern));
      }

      return cb.and(predicates.toArray(new Predicate[0]));
    };

    PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
    return repository.findAll(spec, pageRequest).map(mapper::toDomain);
  }
}
