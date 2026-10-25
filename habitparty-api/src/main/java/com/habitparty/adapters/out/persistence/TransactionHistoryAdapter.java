package com.habitparty.adapters.out.persistence;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import jakarta.persistence.criteria.Predicate;

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
    
    long count = repository.countByUser_IdAndTransactionTypeInAndCreatedAtBetween(
        userId, 
        List.of(
            TransactionType.HABIT_COMPLETED,
            TransactionType.DAILY_COMPLETED,
            TransactionType.TODO_COMPLETED,
            TransactionType.TASK_COMPLETED
        ), 
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
  public void deleteAllByUserId(UUID userId) {
    repository.deleteAllByUserId(userId);
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

    @Override
    public Page<TransactionHistory> findFiltered(UUID userId, List<TransactionType> types, LocalDateTime startDate, String search, int page, int size) {
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
