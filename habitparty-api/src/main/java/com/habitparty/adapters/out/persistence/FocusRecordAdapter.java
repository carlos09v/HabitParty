package com.habitparty.adapters.out.persistence;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

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

  public FocusRecordAdapter(FocusRecordJpaRepository repository, FocusRecordMapper mapper) {
    this.repository = repository;
    this.mapper = mapper;
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
  public void deleteById(UUID id) {
    repository.deleteById(id);
  }

  @Override
  public void deleteAllByFocusActivityId(UUID focusActivityId) {
    repository.deleteAllByFocusActivityId(focusActivityId);
  }

  @Override
  public void nullifyFocusActivityId(UUID focusActivityId) {
    repository.nullifyFocusActivityId(focusActivityId);
  }

  @Override
  public Page<FocusRecord> findAllByFocusActivityId(UUID focusActivityId, int page, int size) {
    PageRequest pageRequest = PageRequest.of(page, size);
    return repository.findAllByFocusActivityIdOrderByStartTimeDesc(focusActivityId, pageRequest)
        .map(mapper::toDomain);
  }

  @Override
  public int sumFocusMinutesToday(UUID userId) {
    LocalDateTime startOfDay = LocalDateTime.now().toLocalDate().atStartOfDay();
    LocalDateTime endOfDay = LocalDateTime.now().toLocalDate().atTime(23, 59, 59, 999999999);
    return repository.sumTodayFocusMinutesByUserId(userId, startOfDay, endOfDay);
  }
}
