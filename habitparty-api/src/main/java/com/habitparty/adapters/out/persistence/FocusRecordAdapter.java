package com.habitparty.adapters.out.persistence;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
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
    FocusRecordJpaEntity entity = mapper.toEntity(record);
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
  public List<FocusRecord> findAllByInventoryItemId(UUID inventoryItemId) {
    return repository.findAllByInventoryItemIdOrderByStartTimeDesc(inventoryItemId).stream()
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
    LocalDateTime startOfDay = today.atTime(LocalTime.MIN)
        .atZone(effectiveZone)
        .withZoneSameInstant(ZoneId.systemDefault())
        .toLocalDateTime();
    LocalDateTime endOfDay = today.atTime(23, 59, 59, 999999999)
        .atZone(effectiveZone)
        .withZoneSameInstant(ZoneId.systemDefault())
        .toLocalDateTime();
    return repository.sumTodayFocusMinutesByUserId(userId, startOfDay, endOfDay);
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
    return repository.existsStandaloneByTaskId(taskId);
  }
}
