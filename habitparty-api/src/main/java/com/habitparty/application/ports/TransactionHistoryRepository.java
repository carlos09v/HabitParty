package com.habitparty.application.ports;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;

import com.habitparty.core.domain.entities.TransactionHistory;
import com.habitparty.core.domain.enums.TransactionType;

public interface TransactionHistoryRepository {
  // 1. Para salvar um novo registro (Usado silenciosamente por outros UseCases)
  void save(TransactionHistory transaction);

  // Busca paginada de todo o histórico do usuário
  Page<TransactionHistory> findAllByUserId(UUID userId, int page, int size);

  // Busca paginada filtrada pelos tipos de transação (Usado para as abas)
  Page<TransactionHistory> findAllByUserIdAndTypes(UUID userId, List<TransactionType> types, int page, int size);

  // Busca paginada filtrada flexível (tipos, período/data inicial, busca textual)
  Page<TransactionHistory> findFiltered(UUID userId, List<TransactionType> types, LocalDateTime startDate, String search, int page, int size);

  // 3. Para deletar um registro específico (Seu botão futuro)
  void deleteById(UUID id);

  // 4. Buscar um específico (necessário para validar o Ownership antes de deletar)
  Optional<TransactionHistory> findById(UUID id);

  // Pra validar o incrementStreak do user
  int countCompletedTasksToday(UUID userId);

  default int countCompletedTasksToday(UUID userId, ZoneId userZone) {
    return countCompletedTasksToday(userId);
  }

  // Verifica se o usuário completou pelo menos 1 tarefa ontem (evita manter streak vencido)
  default boolean hasCompletedTasksYesterday(UUID userId) {
    return true;
  }

  default boolean hasCompletedTasksYesterday(UUID userId, ZoneId userZone) {
    return hasCompletedTasksYesterday(userId);
  }

  // Verifica se o usuário completou alguma tarefa ontem ou hoje (usado para validar streak efetivo na leitura)
  default boolean hasCompletedTasksSinceYesterday(UUID userId) {
    return true;
  }

  default boolean hasCompletedTasksSinceYesterday(UUID userId, ZoneId userZone) {
    return hasCompletedTasksSinceYesterday(userId);
  }

  default Map<UUID, LocalDateTime> findLastCompletedTaskAtByUserIds(Collection<UUID> userIds, LocalDateTime since) {
    return Map.of();
  }

  void deleteAllByUserId(UUID userId);

  // Exclusão em lote (apenas registros pertencentes ao usuário). Retorna a quantidade removida.
  int deleteAllByIdsAndUserId(List<UUID> ids, UUID userId);

  // Remove todos os registros vinculados a uma origem (Task, Reward, FocusRecord) do usuário
  void deleteAllByReferenceIdAndUserId(UUID referenceId, UUID userId);

  // Remove todos os registros vinculados a várias origens do usuário
  void deleteAllByReferenceIdsAndUserId(List<UUID> referenceIds, UUID userId);

  // Verifica se existem registros no histórico vinculados a uma origem do usuário
  boolean existsByReferenceIdAndUserId(UUID referenceId, UUID userId);

  default List<TransactionHistory> findAllByUserIdAndPeriod(
      UUID userId, LocalDateTime startInclusive, LocalDateTime endInclusive) {
    return List.of();
  }

  default java.util.Optional<LocalDateTime> findEarliestCreatedAtByUserId(UUID userId) {
    return java.util.Optional.empty();
  }

  default long countByUserIdAndReferenceIdAndTypeInRange(
      UUID userId,
      UUID referenceId,
      TransactionType transactionType,
      LocalDateTime startInclusive,
      LocalDateTime endExclusive) {
    return 0L;
  }

  default long countByUserIdAndReferenceIdAndTypeOnDate(
      UUID userId,
      UUID referenceId,
      TransactionType transactionType,
      LocalDate targetDate,
      ZoneId userZone) {
    ZoneId systemZone = ZoneId.systemDefault();
    ZoneId effectiveZone = userZone != null ? userZone : systemZone;
    LocalDate effectiveDate = targetDate != null ? targetDate : LocalDate.now(effectiveZone);
    LocalDateTime startInclusive = effectiveDate.atStartOfDay(effectiveZone)
        .withZoneSameInstant(systemZone)
        .toLocalDateTime();
    LocalDateTime endExclusive = effectiveDate.plusDays(1).atStartOfDay(effectiveZone)
        .withZoneSameInstant(systemZone)
        .toLocalDateTime();
    return countByUserIdAndReferenceIdAndTypeInRange(
        userId, referenceId, transactionType, startInclusive, endExclusive);
  }

  default long countMismatchedFocusCompletedTimestamps() {
    return 0L;
  }

  default int syncFocusCompletedTimestamps() {
    return 0;
  }

  default int updateFocusRewardSnapshot(
      UUID referenceId, UUID userId, int xpAmount, BigDecimal goldAmount) {
    return 0;
  }
}
