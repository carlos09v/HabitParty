package com.habitparty.adapters.out.persistence;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Tuple;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Order;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

import org.hibernate.query.criteria.HibernateCriteriaBuilder;
import org.hibernate.query.criteria.JpaExpression;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

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
      TransactionType.TASK_COMPLETED);

  public static final List<TransactionType> POSITIVE_REWARD_TYPES = List.of(
      TransactionType.HABIT_COMPLETED,
      TransactionType.DAILY_COMPLETED,
      TransactionType.TODO_COMPLETED,
      TransactionType.TASK_COMPLETED,
      TransactionType.FOCUS_COMPLETED);

  private final TransactionHistoryJpaRepository repository;
  private final TransactionHistoryMapper mapper;
  private final Clock clock;

  @PersistenceContext
  private EntityManager entityManager;

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
        .withZoneSameInstant(clock.getZone())
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
    LocalDateTime nextDayStart = toStorageDateTime(today.plusDays(1), LocalTime.MIN, effectiveZone);

    long count = repository.countByUserIdAndTransactionTypeInAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
        userId,
        COMPLETED_TASK_TYPES,
        startOfDay,
        nextDayStart);

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
    LocalDateTime startOfToday = toStorageDateTime(yesterday.plusDays(1), LocalTime.MIN, effectiveZone);

    return repository.countByUserIdAndTransactionTypeInAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
        userId,
        COMPLETED_TASK_TYPES,
        startOfYesterday,
        startOfToday) > 0;
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
    return repository.existsByUserIdAndTransactionTypeInAndCreatedAtGreaterThanEqual(
        userId,
        COMPLETED_TASK_TYPES,
        sinceYesterday);
  }

  @Override
  public Map<UUID, LocalDateTime> findLastCompletedTaskAtByUserIds(Collection<UUID> userIds, LocalDateTime since) {
    if (userIds == null || userIds.isEmpty()) {
      return Map.of();
    }
    Map<UUID, LocalDateTime> result = new HashMap<>();
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
  public void saveAll(Collection<TransactionHistory> transactions) {
    if (transactions == null || transactions.isEmpty()) {
      return;
    }
    List<TransactionHistoryJpaEntity> entities = transactions.stream()
        .filter(Objects::nonNull)
        .map(mapper::toEntity)
        .toList();
    if (!entities.isEmpty()) {
      repository.saveAll(entities);
    }
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
  public int deleteAllByReferenceIdAndUserIdAndType(
      UUID referenceId, UUID userId, TransactionType transactionType) {
    if (referenceId == null || userId == null || transactionType == null) {
      return 0;
    }
    return repository.deleteAllByReferenceIdAndUserIdAndTransactionType(referenceId, userId, transactionType);
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
  public int hideByIdAndUserId(UUID id, UUID userId) {
    if (id == null || userId == null) {
      return 0;
    }
    return repository.hideByIdAndUserId(id, userId);
  }

  @Override
  public int hideAllByIdsAndUserId(List<UUID> ids, UUID userId) {
    if (ids == null || ids.isEmpty() || userId == null) {
      return 0;
    }
    return repository.hideAllByIdInAndUserId(ids, userId);
  }

  @Override
  public int restoreAllByIdsAndUserId(List<UUID> ids, UUID userId) {
    if (ids == null || ids.isEmpty() || userId == null) {
      return 0;
    }
    return repository.restoreAllByIdInAndUserId(ids, userId);
  }

  @Override
  public Page<TransactionHistory> findFiltered(
      UUID userId, List<TransactionType> types, LocalDateTime startDate, String search, int page, int size) {
    return findFiltered(userId, new TransactionHistoryFilter(types, startDate, search), page, size);
  }

  @Override
  public Page<TransactionHistory> findFiltered(
      UUID userId, TransactionHistoryFilter filter, int page, int size) {
    TransactionHistoryFilter safeFilter = filter != null
        ? filter
        : new TransactionHistoryFilter(null, null, null);
    Specification<TransactionHistoryJpaEntity> spec = (root, query, cb) ->
        cb.and(buildFilteredPredicates(userId, safeFilter, null, null, root, cb).toArray(new Predicate[0]));

    PageRequest pageRequest = PageRequest.of(page, size, resolveSort(safeFilter.sort()));
    return repository.findAll(spec, pageRequest).map(mapper::toDomain);
  }

  @Override
  public boolean supportsDirectPageContent() {
    return entityManager != null;
  }

  @Override
  public List<TransactionHistory> findFilteredPageContent(
      UUID userId, TransactionHistoryFilter filter, int page, int size) {
    TransactionHistoryFilter safeFilter = filter != null
        ? filter
        : new TransactionHistoryFilter(null, null, null);
    int safePage = Math.max(page, 0);
    int safeSize = Math.min(Math.max(size, 1), 1000);

    if (entityManager == null) {
      return findFiltered(userId, safeFilter, safePage, safeSize).getContent();
    }

    CriteriaBuilder cb = entityManager.getCriteriaBuilder();
    CriteriaQuery<TransactionHistoryJpaEntity> cq = cb.createQuery(TransactionHistoryJpaEntity.class);
    Root<TransactionHistoryJpaEntity> root = cq.from(TransactionHistoryJpaEntity.class);
    List<Predicate> predicates = buildFilteredPredicates(userId, safeFilter, null, null, root, cb);
    cq.select(root)
        .where(predicates.toArray(new Predicate[0]))
        .orderBy(resolveCriteriaOrders(safeFilter.sort(), root, cb));

    return entityManager.createQuery(cq)
        .setFirstResult(safePage * safeSize)
        .setMaxResults(safeSize)
        .getResultList()
        .stream()
        .map(mapper::toDomain)
        .toList();
  }

  @Override
  public List<TransactionHistory> findFilteredSliceAfterCursor(
      UUID userId,
      TransactionHistoryFilter filter,
      LocalDateTime cursorCreatedAt,
      UUID cursorId,
      int limit) {
    int safeLimit = Math.min(Math.max(limit, 1), 1000);
    TransactionHistoryFilter safeFilter = filter != null
        ? filter
        : new TransactionHistoryFilter(null, null, null);
    boolean isOldest = isOldestSort(safeFilter.sort());

    if (entityManager != null) {
      CriteriaBuilder cb = entityManager.getCriteriaBuilder();
      CriteriaQuery<TransactionHistoryJpaEntity> cq = cb.createQuery(TransactionHistoryJpaEntity.class);
      Root<TransactionHistoryJpaEntity> root = cq.from(TransactionHistoryJpaEntity.class);
      List<Predicate> predicates = buildFilteredPredicates(userId, safeFilter, cursorCreatedAt, cursorId, root, cb);
      cq.select(root)
          .where(predicates.toArray(new Predicate[0]))
          .orderBy(isOldest
              ? List.of(cb.asc(root.get("createdAt")), cb.asc(root.get("id")))
              : List.of(cb.desc(root.get("createdAt")), cb.desc(root.get("id"))));
      return entityManager.createQuery(cq)
          .setMaxResults(safeLimit)
          .getResultList()
          .stream()
          .map(mapper::toDomain)
          .toList();
    }

    Specification<TransactionHistoryJpaEntity> spec = (root, query, cb) ->
        cb.and(buildFilteredPredicates(userId, safeFilter, cursorCreatedAt, cursorId, root, cb).toArray(new Predicate[0]));
    Sort keysetSort = isOldest
        ? Sort.by(Sort.Direction.ASC, "createdAt").and(Sort.by(Sort.Direction.ASC, "id"))
        : Sort.by(Sort.Direction.DESC, "createdAt").and(Sort.by(Sort.Direction.DESC, "id"));
    PageRequest pageRequest = PageRequest.of(0, safeLimit, keysetSort);
    return repository.findAll(spec, pageRequest).getContent().stream()
        .map(mapper::toDomain)
        .toList();
  }

  @Override
  public TransactionHistorySummary summarizeFiltered(UUID userId, TransactionHistoryFilter filter) {
    if (entityManager == null || userId == null) {
      return TransactionHistorySummary.empty();
    }
    TransactionHistoryFilter safeFilter = filter != null
        ? filter
        : new TransactionHistoryFilter(null, null, null);

    CriteriaBuilder cb = entityManager.getCriteriaBuilder();
    CriteriaQuery<Tuple> cq = cb.createTupleQuery();
    Root<TransactionHistoryJpaEntity> root = cq.from(TransactionHistoryJpaEntity.class);
    List<Predicate> predicates = buildFilteredPredicates(userId, safeFilter, null, null, root, cb);

    Expression<BigDecimal> goldPath = root.get("goldAmount");
    Expression<Integer> xpPath = root.get("xpAmount");

    Expression<BigDecimal> goldEarnedExpr = cb.sum(
        cb.<BigDecimal>selectCase()
            .when(cb.greaterThan(goldPath, BigDecimal.ZERO), goldPath)
            .otherwise(BigDecimal.ZERO));
    Expression<BigDecimal> goldSpentExpr = cb.sum(
        cb.<BigDecimal>selectCase()
            .when(cb.lessThan(goldPath, BigDecimal.ZERO), cb.neg(goldPath))
            .otherwise(BigDecimal.ZERO));
    Expression<Long> xpEarnedExpr = cb.sumAsLong(
        cb.<Integer>selectCase()
            .when(cb.greaterThan(xpPath, 0), xpPath)
            .otherwise(0));
    Expression<Long> xpLostExpr = cb.sumAsLong(
        cb.<Integer>selectCase()
            .when(cb.lessThan(xpPath, 0), cb.neg(xpPath))
            .otherwise(0));
    Expression<Long> totalCountExpr = cb.count(root.get("id"));

    cq.multiselect(goldEarnedExpr, goldSpentExpr, xpEarnedExpr, xpLostExpr, totalCountExpr)
        .where(predicates.toArray(new Predicate[0]));

    Tuple result = entityManager.createQuery(cq).getSingleResult();
    if (result == null) {
      return TransactionHistorySummary.empty();
    }
    BigDecimal goldEarned = result.get(0, BigDecimal.class);
    BigDecimal goldSpent = result.get(1, BigDecimal.class);
    Long xpEarned = result.get(2, Long.class);
    Long xpLost = result.get(3, Long.class);
    Long totalCount = result.get(4, Long.class);

    return new TransactionHistorySummary(
        goldEarned != null ? goldEarned : BigDecimal.ZERO,
        goldSpent != null ? goldSpent : BigDecimal.ZERO,
        xpEarned != null ? Math.toIntExact(xpEarned) : 0,
        xpLost != null ? Math.toIntExact(xpLost) : 0,
        totalCount != null ? totalCount : 0L);
  }

  private List<Predicate> buildFilteredPredicates(
      UUID userId,
      TransactionHistoryFilter filter,
      LocalDateTime cursorCreatedAt,
      UUID cursorId,
      Root<TransactionHistoryJpaEntity> root,
      CriteriaBuilder cb) {
    List<Predicate> predicates = new ArrayList<>();
    predicates.add(cb.equal(root.get("userId"), userId));
    predicates.add(cb.isFalse(root.get("hiddenFromHistory")));

    if (filter.types() != null && !filter.types().isEmpty()) {
      predicates.add(root.get("transactionType").in(filter.types()));
    }

    if (filter.startDate() != null) {
      predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), filter.startDate()));
    }

    if (filter.endDate() != null) {
      predicates.add(cb.lessThan(root.get("createdAt"), filter.endDate()));
    }

    if (filter.direction() != null && !filter.direction().isBlank()) {
      String normalizedDirection = filter.direction().trim().toUpperCase(Locale.ROOT);
      if ("IN".equals(normalizedDirection)) {
        predicates.add(cb.or(
            cb.greaterThan(root.get("goldAmount"), BigDecimal.ZERO),
            cb.greaterThan(root.get("xpAmount"), 0)));
      } else if ("OUT".equals(normalizedDirection)) {
        predicates.add(cb.or(
            cb.lessThan(root.get("goldAmount"), BigDecimal.ZERO),
            cb.lessThan(root.get("xpAmount"), 0)));
      }
    }

    if (filter.search() != null && !filter.search().trim().isEmpty()) {
      String pattern = "%" + escapeLikePattern(filter.search().trim().toLowerCase(Locale.ROOT)) + "%";
      Expression<?> tagsPath = root.get("tagsSnapshot");
      Expression<String> tagsAsText = (cb instanceof HibernateCriteriaBuilder hcb
          && tagsPath instanceof JpaExpression<?> jpaTags)
          ? hcb.cast(jpaTags, String.class)
          : tagsPath.as(String.class);
      predicates.add(cb.or(
          cb.like(cb.lower(root.get("nameSnapshot")), pattern, '\\'),
          cb.like(cb.lower(cb.coalesce(root.get("columnNameSnapshot"), "")), pattern, '\\'),
          cb.like(cb.lower(cb.coalesce(root.get("descriptionSnapshot"), "")), pattern, '\\'),
          cb.like(cb.lower(cb.coalesce(tagsAsText, "")), pattern, '\\')));
    }

    if (cursorCreatedAt != null && cursorId != null) {
      if (isOldestSort(filter.sort())) {
        predicates.add(cb.or(
            cb.greaterThan(root.get("createdAt"), cursorCreatedAt),
            cb.and(
                cb.equal(root.get("createdAt"), cursorCreatedAt),
                cb.greaterThan(root.get("id"), cursorId))));
      } else {
        predicates.add(cb.or(
            cb.lessThan(root.get("createdAt"), cursorCreatedAt),
            cb.and(
                cb.equal(root.get("createdAt"), cursorCreatedAt),
                cb.lessThan(root.get("id"), cursorId))));
      }
    }

    return predicates;
  }

  private static boolean isOldestSort(String sort) {
    return sort != null && "OLDEST".equalsIgnoreCase(sort.trim());
  }

  private static List<Order> resolveCriteriaOrders(
      String sort, Root<TransactionHistoryJpaEntity> root, CriteriaBuilder cb) {
    String normalized = sort != null ? sort.trim().toUpperCase(Locale.ROOT) : "NEWEST";
    return switch (normalized) {
      case "OLDEST" -> List.of(cb.asc(root.get("createdAt")), cb.asc(root.get("id")));
      case "HIGHEST_GOLD" -> List.of(
          cb.asc(cb.<Integer>selectCase().when(cb.isNull(root.get("goldAmount")), 1).otherwise(0)),
          cb.desc(root.get("goldAmount")),
          cb.desc(root.get("createdAt")),
          cb.desc(root.get("id")));
      case "LOWEST_GOLD" -> List.of(
          cb.asc(cb.<Integer>selectCase().when(cb.isNull(root.get("goldAmount")), 1).otherwise(0)),
          cb.asc(root.get("goldAmount")),
          cb.desc(root.get("createdAt")),
          cb.desc(root.get("id")));
      default -> List.of(cb.desc(root.get("createdAt")), cb.desc(root.get("id")));
    };
  }

  private static Sort resolveSort(String sort) {
    if (sort == null || sort.isBlank()) {
      return Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"));
    }
    return switch (sort.trim().toUpperCase(Locale.ROOT)) {
      case "OLDEST" -> Sort.by(Sort.Order.asc("createdAt"), Sort.Order.asc("id"));
      case "HIGHEST_GOLD" -> Sort.by(
          Sort.Order.desc("goldAmount").nullsLast(),
          Sort.Order.desc("createdAt"),
          Sort.Order.desc("id"));
      case "LOWEST_GOLD" -> Sort.by(
          Sort.Order.asc("goldAmount").nullsLast(),
          Sort.Order.desc("createdAt"),
          Sort.Order.desc("id"));
      default -> Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"));
    };
  }

  static String escapeLikePattern(String raw) {
    return raw
        .replace("\\", "\\\\")
        .replace("%", "\\%")
        .replace("_", "\\_");
  }

  @Override
  public Optional<Boolean> existsAnyByReferenceIdsAndUserId(Collection<UUID> referenceIds, UUID userId) {
    if (referenceIds == null || referenceIds.isEmpty() || userId == null) {
      return Optional.of(false);
    }
    return Optional.of(repository.existsByReferenceIdInAndUserId(referenceIds, userId));
  }

  @Override
  public Optional<List<RetrospectiveTxBucket>> aggregateForRetrospective(
      UUID userId, LocalDateTime startInclusive, LocalDateTime endExclusive) {
    if (userId == null || startInclusive == null || endExclusive == null) {
      return Optional.of(List.of());
    }
    List<Object[]> rows = repository.aggregateForRetrospective(
        userId, COMPLETED_TASK_TYPES, POSITIVE_REWARD_TYPES, startInclusive, endExclusive);
    List<RetrospectiveTxBucket> buckets = new ArrayList<>(rows.size());
    for (Object[] row : rows) {
      BigDecimal coins = row[8] instanceof BigDecimal bd
          ? bd
          : (row[8] instanceof Number n ? BigDecimal.valueOf(n.doubleValue()) : BigDecimal.ZERO);
      buckets.add(new RetrospectiveTxBucket(
          ((Number) row[0]).intValue(),
          ((Number) row[1]).intValue(),
          ((Number) row[2]).intValue(),
          ((Number) row[3]).intValue(),
          ((Number) row[4]).intValue(),
          ((Number) row[5]).intValue(),
          ((Number) row[6]).intValue(),
          ((Number) row[7]).intValue(),
          coins));
    }
    return Optional.of(buckets);
  }

  @Override
  public List<TransactionHistory> findAllByUserIdAndPeriod(
      UUID userId, LocalDateTime startInclusive, LocalDateTime endInclusive) {
    if (userId == null || startInclusive == null || endInclusive == null) {
      return List.of();
    }
    return repository.findAllByUserIdAndCreatedAtBetweenOrderByCreatedAtAsc(userId, startInclusive, endInclusive)
        .stream()
        .map(mapper::toDomain)
        .toList();
  }

  @Override
  public Optional<LocalDateTime> findEarliestCreatedAtByUserId(UUID userId) {
    if (userId == null) {
      return Optional.empty();
    }
    return Optional.ofNullable(repository.findEarliestCreatedAtByUserId(userId));
  }

  @Override
  public long countByUserIdAndReferenceIdAndTypeInRange(
      UUID userId,
      UUID referenceId,
      TransactionType transactionType,
      LocalDateTime startInclusive,
      LocalDateTime endExclusive) {
    if (userId == null || referenceId == null || transactionType == null
        || startInclusive == null || endExclusive == null) {
      return 0L;
    }
    return repository.countHabitScoreTransactionsInRange(
        userId,
        referenceId,
        transactionType,
        startInclusive,
        endExclusive);
  }

  @Override
  public long countByUserIdAndReferenceIdAndTypeOnDate(
      UUID userId,
      UUID referenceId,
      TransactionType transactionType,
      LocalDate targetDate,
      ZoneId userZone) {
    if (userId == null || referenceId == null || transactionType == null) {
      return 0L;
    }
    ZoneId effectiveZone = resolveZone(userZone);
    LocalDate effectiveDate = targetDate != null ? targetDate : LocalDate.now(clock.withZone(effectiveZone));
    LocalDateTime startInclusive = toStorageDateTime(effectiveDate, LocalTime.MIN, effectiveZone);
    LocalDateTime endExclusive = toStorageDateTime(effectiveDate.plusDays(1), LocalTime.MIN, effectiveZone);
    return repository.countHabitScoreTransactionsInRange(
        userId,
        referenceId,
        transactionType,
        startInclusive,
        endExclusive);
  }

  @Override
  public long countMismatchedFocusCompletedTimestamps() {
    return repository.countMismatchedFocusCompletedTimestamps();
  }

  @Override
  public int syncFocusCompletedTimestamps() {
    return repository.syncFocusCompletedTimestampsWithFocusRecords();
  }

  @Override
  public Optional<LocalDateTime> findLatestTaskCompletionCreatedAtByUserId(UUID userId) {
    if (userId == null) {
      return Optional.empty();
    }
    return Optional.ofNullable(
        repository.findLatestCreatedAtByUserIdAndTypes(userId, COMPLETED_TASK_TYPES));
  }

  @Override
  public List<TransactionHistory> findTop2ByUserIdAndReferenceIdAndType(
      UUID userId, UUID referenceId, TransactionType transactionType) {
    if (userId == null || referenceId == null || transactionType == null) {
      return List.of();
    }
    return repository
        .findTop2ByUserIdAndReferenceIdAndTransactionTypeOrderByCreatedAtDesc(
            userId, referenceId, transactionType)
        .stream()
        .map(mapper::toDomain)
        .toList();
  }

  @Override
  public int updateFocusRewardSnapshot(
      UUID referenceId, UUID userId, int xpAmount, BigDecimal goldAmount) {
    if (referenceId == null || userId == null) {
      return 0;
    }
    return repository.updateFocusRewardSnapshot(
        referenceId,
        userId,
        Math.max(0, xpAmount),
        goldAmount != null ? goldAmount : BigDecimal.ZERO);
  }

  @Override
  public int updateFocusDescriptionSnapshot(
      UUID referenceId, UUID userId, String descriptionSnapshot) {
    if (referenceId == null || userId == null) {
      return 0;
    }
    String cleanDescription = (descriptionSnapshot != null && !descriptionSnapshot.trim().isEmpty())
        ? descriptionSnapshot.trim()
        : null;
    return repository.updateFocusDescriptionSnapshot(referenceId, userId, cleanDescription);
  }

  @Override
  @Transactional
  public int updateFocusCompletedSnapshot(
      UUID referenceId,
      UUID userId,
      String nameSnapshot,
      String iconSnapshot,
      BigDecimal goldAmount,
      int xpAmount,
      List<String> tagsSnapshot,
      String descriptionSnapshot,
      LocalDateTime createdAt) {
    if (referenceId == null || userId == null) {
      return 0;
    }
    if (createdAt != null) {
      repository.updateFocusCreatedAt(referenceId, userId, createdAt);
    }
    List<TransactionHistoryJpaEntity> entities = repository
        .findAllByUserIdAndReferenceIdAndTransactionType(
            userId, referenceId, TransactionType.FOCUS_COMPLETED);
    if (entities.isEmpty()) {
      return 0;
    }
    String cleanDescription = (descriptionSnapshot != null && !descriptionSnapshot.trim().isEmpty())
        ? descriptionSnapshot.trim()
        : null;
    BigDecimal safeGold = goldAmount != null ? goldAmount : BigDecimal.ZERO;
    int safeXp = Math.max(0, xpAmount);
    List<String> safeTags = tagsSnapshot != null ? new ArrayList<>(tagsSnapshot) : new ArrayList<>();
    for (TransactionHistoryJpaEntity entity : entities) {
      if (nameSnapshot != null && !nameSnapshot.isBlank()) {
        entity.setNameSnapshot(nameSnapshot);
      }
      entity.setIconSnapshot(iconSnapshot);
      entity.setGoldAmount(safeGold);
      entity.setXpAmount(safeXp);
      entity.setTagsSnapshot(new ArrayList<>(safeTags));
      entity.setDescriptionSnapshot(cleanDescription);
    }
    repository.saveAll(entities);
    return entities.size();
  }

  @Override
  public List<TaskCompletionTimestamp> findTaskCompletionsByUserIdsSince(
      Collection<UUID> userIds, LocalDateTime since) {
    if (userIds == null || userIds.isEmpty() || since == null) {
      return List.of();
    }
    return repository.findTaskCompletionsByUserIdsSince(userIds, COMPLETED_TASK_TYPES, since)
        .stream()
        .map(row -> new TaskCompletionTimestamp(row.getUserId(), row.getCreatedAt()))
        .toList();
  }
}
