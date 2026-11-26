package com.habitparty.adapters.out.persistence;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.entities.FocusRecordJpaEntity;
import com.habitparty.adapters.out.persistence.mappers.FocusRecordMapper;
import com.habitparty.adapters.out.persistence.repository.FocusRecordJpaRepository;
import com.habitparty.application.ports.FocusRecordRepository;
import com.habitparty.core.domain.entities.focus.FocusRecord;

@Component
public class FocusRecordAdapter implements FocusRecordRepository {
  private final FocusRecordJpaRepository repository;
  private final FocusRecordMapper mapper;
  private final Clock clock;

  @Autowired
  public FocusRecordAdapter(
      FocusRecordJpaRepository repository,
      FocusRecordMapper mapper,
      Clock clock) {
    this.repository = repository;
    this.mapper = mapper;
    this.clock = clock != null ? clock : Clock.systemDefaultZone();
  }

  public FocusRecordAdapter(FocusRecordJpaRepository repository, FocusRecordMapper mapper) {
    this(repository, mapper, Clock.systemDefaultZone());
  }

  @Override
  public FocusRecord save(FocusRecord record) {
    FocusRecordJpaEntity entity = repository.findById(record.getId())
        .map(existing -> {
          mapper.updateEntityFromDomain(existing, record);
          return existing;
        })
        .orElseGet(() -> mapper.toEntity(record));
    FocusRecordJpaEntity savedEntity = repository.save(entity);
    return mapper.toDomain(savedEntity);
  }

  @Override
  public Optional<FocusRecord> findById(UUID id) {
    return repository.findById(id).map(mapper::toDomain);
  }

  @Override
  public List<FocusRecord> findAllByUserId(UUID userId) {
    return repository.findAllByUserIdOrderByStartTimeDesc(userId).stream()
        .map(mapper::toDomain)
        .toList();
  }

  @Override
  public List<FocusRecord> findAllByFocusActivityId(UUID focusActivityId) {
    return repository.findAllByFocusActivityIdOrderByStartTimeDesc(focusActivityId).stream()
        .map(mapper::toDomain)
        .toList();
  }

  @Override
  public List<FocusRecord> findAllByTaskId(UUID taskId) {
    return repository.findAllByTaskIdOrderByStartTimeDesc(taskId).stream()
        .map(mapper::toDomain)
        .toList();
  }

  @Override
  public void deleteById(UUID id) {
    repository.deleteById(id);
  }

  @Override
  public void deleteAllByIds(List<UUID> ids) {
    if (ids == null || ids.isEmpty()) {
      return;
    }
    repository.deleteAllByIdInBatch(ids);
  }

  @Override
  public void deleteAllByFocusActivityId(UUID focusActivityId) {
    repository.deleteAllByFocusActivityId(focusActivityId);
  }

  @Override
  public void deleteAllByTaskId(UUID taskId) {
    repository.deleteAllByTaskId(taskId);
  }

  @Override
  public void nullifyFocusActivityId(UUID focusActivityId) {
    repository.nullifyFocusActivityId(focusActivityId);
  }

  @Override
  public void nullifyTaskId(UUID taskId) {
    repository.nullifyTaskId(taskId);
  }

  @Override
  public void nullifyTaskIds(Collection<UUID> taskIds) {
    if (taskIds == null || taskIds.isEmpty()) {
      return;
    }
    repository.nullifyTaskIdIn(taskIds);
  }

  @Override
  public Page<FocusRecord> findAllByFocusActivityId(UUID focusActivityId, int page, int size) {
    PageRequest pageRequest = PageRequest.of(page, size);
    return repository.findAllByFocusActivityIdOrderByStartTimeDesc(focusActivityId, pageRequest)
        .map(mapper::toDomain);
  }

  @Override
  public Page<FocusRecord> findAllByTaskId(UUID taskId, int page, int size) {
    PageRequest pageRequest = PageRequest.of(page, size);
    return repository.findAllByTaskIdOrderByStartTimeDesc(taskId, pageRequest)
        .map(mapper::toDomain);
  }

  @Override
  public Page<FocusRecord> findAllByUserId(UUID userId, int page, int size) {
    PageRequest pageRequest = PageRequest.of(page, size);
    return repository.findAllByUserIdOrderByStartTimeDesc(userId, pageRequest)
        .map(mapper::toDomain);
  }

  @Override
  public int sumFocusMinutesToday(UUID userId) {
    return sumFocusMinutesToday(userId, clock.getZone());
  }

  @Override
  public int sumFocusMinutesToday(UUID userId, ZoneId userZone) {
    ZoneId effectiveZone = userZone != null ? userZone : clock.getZone();
    LocalDate today = LocalDate.now(clock.withZone(effectiveZone));
    return sumFocusMinutesOnDate(userId, today, effectiveZone);
  }

  // Intervalo semi-aberto [startOfDay, nextDayStart) no fuso do Clock para evitar
  // arredondamento de .999999999 para 00:00:00 de D+1 no TIMESTAMP(6) do PostgreSQL.
  private LocalDateTime[] resolveServerDayRange(LocalDate targetDate, ZoneId userZone) {
    ZoneId effectiveZone = userZone != null ? userZone : clock.getZone();
    LocalDate effectiveDate = targetDate != null ? targetDate : LocalDate.now(clock.withZone(effectiveZone));
    ZoneId storageZone = clock.getZone();
    LocalDateTime startOfDay = effectiveDate.atTime(LocalTime.MIN)
        .atZone(effectiveZone)
        .withZoneSameInstant(storageZone)
        .toLocalDateTime();
    LocalDateTime nextDayStart = effectiveDate.plusDays(1).atTime(LocalTime.MIN)
        .atZone(effectiveZone)
        .withZoneSameInstant(storageZone)
        .toLocalDateTime();
    return new LocalDateTime[] {startOfDay, nextDayStart};
  }

  @Override
  public int sumFocusMinutesOnDate(UUID userId, LocalDate targetDate, ZoneId userZone) {
    LocalDateTime[] range = resolveServerDayRange(targetDate, userZone);
    return repository.sumTodayFocusMinutesByUserId(userId, range[0], range[1]);
  }

  @Override
  public int sumFocusMinutesOnDateExcludingRecord(
      UUID userId, LocalDate targetDate, ZoneId userZone, UUID excludedRecordId) {
    if (excludedRecordId == null) {
      return sumFocusMinutesOnDate(userId, targetDate, userZone);
    }
    LocalDateTime[] range = resolveServerDayRange(targetDate, userZone);
    return repository.sumTodayFocusMinutesByUserIdExcludingRecord(
        userId, range[0], range[1], excludedRecordId);
  }

  @Override
  public int sumProductiveFocusMinutesOnDate(UUID userId, LocalDate targetDate, ZoneId userZone) {
    if (userId == null) {
      return 0;
    }
    LocalDateTime[] range = resolveServerDayRange(targetDate, userZone);
    return repository.sumProductiveFocusMinutesByUserId(userId, range[0], range[1]);
  }

  @Override
  public int sumProductiveFocusMinutesOnDateExcludingRecord(
      UUID userId, LocalDate targetDate, ZoneId userZone, UUID excludedRecordId) {
    if (userId == null) {
      return 0;
    }
    if (excludedRecordId == null) {
      return sumProductiveFocusMinutesOnDate(userId, targetDate, userZone);
    }
    LocalDateTime[] range = resolveServerDayRange(targetDate, userZone);
    return repository.sumProductiveFocusMinutesByUserIdExcludingRecord(
        userId, range[0], range[1], excludedRecordId);
  }

  @Override
  public List<FocusSessionSummary> findProductiveFocusSessionsByUserIdsSince(
      Collection<UUID> userIds, LocalDateTime since) {
    if (userIds == null || userIds.isEmpty() || since == null) {
      return List.of();
    }
    return repository.findProductiveFocusSessionsByUserIdsSince(userIds, since)
        .stream()
        .map(row -> new FocusSessionSummary(row.getUserId(), row.getEndTime(), row.getDurationMinutes()))
        .toList();
  }

  @Override
  public void deleteAllByUserId(UUID userId) {
    repository.deleteAllByUserId(userId);
  }

  @Override
  public boolean existsStandaloneByTaskId(UUID taskId) {
    if (taskId == null) {
      return false;
    }
    return repository.existsByTaskIdAndFocusActivityIdIsNull(taskId);
  }

  @Override
  public List<FocusRecord> findAllByUserIdAndPeriod(
      UUID userId, LocalDateTime startInclusive, LocalDateTime endInclusive) {
    if (userId == null || startInclusive == null || endInclusive == null) {
      return List.of();
    }
    return repository.findAllByUserIdAndEndTimeBetweenOrderByEndTimeAsc(userId, startInclusive, endInclusive)
        .stream()
        .map(mapper::toDomain)
        .toList();
  }

  @Override
  public Optional<List<RetrospectiveFocusBucket>> aggregateForRetrospective(
      UUID userId, LocalDateTime startInclusive, LocalDateTime endExclusive, int minActiveDayMinutes) {
    if (userId == null || startInclusive == null || endExclusive == null) {
      return Optional.of(List.of());
    }
    List<Object[]> rows = repository.aggregateForRetrospective(
        userId, startInclusive, endExclusive, minActiveDayMinutes);
    List<RetrospectiveFocusBucket> buckets = new java.util.ArrayList<>(rows.size());
    for (Object[] row : rows) {
      buckets.add(new RetrospectiveFocusBucket(
          ((Number) row[0]).intValue(),
          ((Number) row[1]).intValue(),
          ((Number) row[2]).intValue(),
          ((Number) row[3]).intValue(),
          ((Number) row[4]).intValue(),
          ((Number) row[5]).intValue(),
          ((Number) row[6]).intValue(),
          ((Number) row[7]).intValue(),
          row[8] instanceof Number n && n.intValue() > 0));
    }
    return Optional.of(buckets);
  }

  @Override
  public Optional<List<FocusRecord>> findAllProductiveByUserIds(Collection<UUID> userIds) {
    if (userIds == null || userIds.isEmpty()) {
      return Optional.of(List.of());
    }
    return Optional.of(repository.findAllByUserIdInAndInventoryItemIdIsNullOrderByStartTimeDesc(userIds)
        .stream()
        .map(mapper::toDomain)
        .toList());
  }

  @Override
  public Optional<LocalDateTime> findEarliestStartTimeByUserId(UUID userId) {
    return findEarliestEndTimeByUserId(userId);
  }

  @Override
  public Optional<LocalDateTime> findEarliestEndTimeByUserId(UUID userId) {
    if (userId == null) {
      return Optional.empty();
    }
    return Optional.ofNullable(repository.findEarliestProductiveEndTimeByUserId(userId));
  }

  @Override
  public List<UUID> findDistinctProductiveUserIds() {
    return repository.findDistinctProductiveUserIds();
  }

  @Override
  public int findMaxProductiveDurationMinutesExcludingRecord(UUID userId, UUID excludedRecordId) {
    if (userId == null || excludedRecordId == null) {
      return 0;
    }
    return repository.findMaxProductiveDurationMinutesExcludingRecord(userId, excludedRecordId);
  }

  @Override
  public int findMaxProductiveDurationMinutesExcludingRecords(UUID userId, List<UUID> excludedRecordIds) {
    if (userId == null) {
      return 0;
    }
    if (excludedRecordIds == null || excludedRecordIds.isEmpty()) {
      return repository.findMaxProductiveDurationMinutesByUserId(userId);
    }
    if (excludedRecordIds.size() == 1) {
      return repository.findMaxProductiveDurationMinutesExcludingRecord(userId, excludedRecordIds.get(0));
    }
    return repository.findMaxProductiveDurationMinutesExcludingRecords(userId, excludedRecordIds);
  }

  @Override
  public ActivityDeletionSummary summarizeImpactByFocusActivityId(UUID focusActivityId) {
    if (focusActivityId == null) {
      return new ActivityDeletionSummary(0L, 0, BigDecimal.ZERO);
    }
    FocusRecordJpaRepository.FocusActivityImpactProjection projection =
        repository.summarizeImpactByFocusActivityId(focusActivityId);
    if (projection == null) {
      return new ActivityDeletionSummary(0L, 0, BigDecimal.ZERO);
    }
    long totalCount = projection.getTotalRecordsCount();
    int totalXp = projection.getTotalXpEarned() != null
        ? Math.toIntExact(projection.getTotalXpEarned())
        : 0;
    BigDecimal totalCoins = projection.getTotalCoinsEarned() != null
        ? projection.getTotalCoinsEarned()
        : BigDecimal.ZERO;
    return new ActivityDeletionSummary(totalCount, totalXp, totalCoins);
  }

  @Override
  public int updateFocusRewards(UUID recordId, int xpEarned, BigDecimal coinsEarned) {
    if (recordId == null) {
      return 0;
    }
    return repository.updateRewardsById(
        recordId,
        Math.max(0, xpEarned),
        coinsEarned != null ? coinsEarned : BigDecimal.ZERO);
  }

  @Override
  public List<FocusAnalyticsEntry> findProductiveAnalyticsEntriesByUserId(UUID userId) {
    if (userId == null) {
      return List.of();
    }
    return repository.findProductiveAnalyticsByUserId(userId).stream()
        .map(row -> new FocusAnalyticsEntry(
            row.getFocusActivityId(),
            row.getEndTime(),
            row.getDurationMinutes(),
            row.getCompletedPomos() != null ? Math.max(0, row.getCompletedPomos()) : 0,
            row.getXpEarned() != null ? Math.max(0, row.getXpEarned()) : 0,
            row.getCoinsEarned() != null ? row.getCoinsEarned() : BigDecimal.ZERO))
        .toList();
  }
}
