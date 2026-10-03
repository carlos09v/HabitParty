package com.habitparty.adapters.out.persistence;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.mappers.TransactionHistoryMapper;
import com.habitparty.adapters.out.persistence.repository.TransactionHistoryJpaRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.core.domain.entities.TransactionHistory;
import com.habitparty.core.domain.enums.TransactionType;

@Component
public class TransactionHistoryAdapter implements TransactionHistoryRepository {
  private final TransactionHistoryJpaRepository repository;
  private final TransactionHistoryMapper mapper;

  public TransactionHistoryAdapter(TransactionHistoryJpaRepository repository, TransactionHistoryMapper mapper) {
    this.repository = repository;
    this.mapper = mapper;
  }

  @Override 
  public int countCompletedTasksToday(UUID userId) {
    LocalDateTime startOfDay = LocalDateTime.now().toLocalDate().atStartOfDay(); 
    LocalDateTime endOfDay = LocalDateTime.now().toLocalDate().atTime(23, 59, 59, 999999999); 
    
    long count = repository.countByUser_IdAndTransactionTypeAndCreatedAtBetween(
        userId, 
        TransactionType.TASK_COMPLETED, 
        startOfDay, 
        endOfDay
    );
    
    return (int) count;
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
    public Page<TransactionHistory> findAllByUserId(UUID userId, int page, int size) {
        return repository.findAllByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size))
                .map(mapper::toDomain);
    }

    @Override
    public Page<TransactionHistory> findAllByUserIdAndTypes(UUID userId, List<TransactionType> types, int page, int size) {
        return repository.findAllByUserIdAndTransactionTypeInOrderByCreatedAtDesc(userId, types, PageRequest.of(page, size))
                .map(mapper::toDomain);
    }
}
