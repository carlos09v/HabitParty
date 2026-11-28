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

  default void saveAll(Collection<TransactionHistory> transactions) {
    if (transactions != null) {
      transactions.forEach(this::save);
    }
  }

  record TransactionHistoryFilter(
      List<TransactionType> types,
      LocalDateTime startDate,
      LocalDateTime endDate,
      String search,
      String direction,
      String sort) {
    public TransactionHistoryFilter(List<TransactionType> types, LocalDateTime startDate, String search) {
      this(types, startDate, null, search, null, null);
    }
  }

  record TransactionHistorySummary(
      BigDecimal goldEarned,
      BigDecimal goldSpent,
      int xpEarned,
      int xpLost,
      long totalCount) {
    public static TransactionHistorySummary empty() {
      return new TransactionHistorySummary(BigDecimal.ZERO, BigDecimal.ZERO, 0, 0, 0L);
    }
  }

  // Busca paginada de todo o histórico visível do usuário
  default Page<TransactionHistory> findAllByUserId(UUID userId, int page, int size) {
    return findFiltered(userId, null, null, null, page, size);
  }

  // Busca paginada filtrada flexível (tipos, período/data inicial, busca textual)
  Page<TransactionHistory> findFiltered(UUID userId, List<TransactionType> types, LocalDateTime startDate, String search, int page, int size);

  default Page<TransactionHistory> findFiltered(UUID userId, TransactionHistoryFilter filter, int page, int size) {
    TransactionHistoryFilter safe = filter != null ? filter : new TransactionHistoryFilter(null, null, null);
    return findFiltered(userId, safe.types(), safe.startDate(), safe.search(), page, size);
  }

  /**
   * Indica se a implementação suporta busca paginada de conteúdo sem query COUNT(*) redundante,
   * permitindo reaproveitar o totalCount já calculado por {@link #summarizeFiltered}.
   */
  default boolean supportsDirectPageContent() {
    return false;
  }

  default List<TransactionHistory> findFilteredPageContent(
      UUID userId, TransactionHistoryFilter filter, int page, int size) {
    return findFiltered(userId, filter, page, size).getContent();
  }

  default List<TransactionHistory> findFilteredSliceAfterCursor(
      UUID userId,
      TransactionHistoryFilter filter,
      LocalDateTime cursorCreatedAt,
      UUID cursorId,
      int limit) {
    return List.of();
  }

  default TransactionHistorySummary summarizeFiltered(UUID userId, TransactionHistoryFilter filter) {
    return TransactionHistorySummary.empty();
  }

  // Ocultamento lógico do extrato (preserva registros operacionais para caps, streak e retrospectiva)
  default int hideByIdAndUserId(UUID id, UUID userId) {
    deleteById(id);
    return 1;
  }

  default int hideAllByIdsAndUserId(List<UUID> ids, UUID userId) {
    return deleteAllByIdsAndUserId(ids, userId);
  }

  default int restoreAllByIdsAndUserId(List<UUID> ids, UUID userId) {
    return 0;
  }

  // 3. Para deletar fisicamente um registro específico (uso operacional/interno)
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

  // Remove registros de um tipo específico vinculados a uma origem (ex.: estorno de ITEM_CONSUMED)
  default int deleteAllByReferenceIdAndUserIdAndType(
      UUID referenceId, UUID userId, TransactionType transactionType) {
    return 0;
  }

  // Remove todos os registros vinculados a várias origens do usuário
  void deleteAllByReferenceIdsAndUserId(List<UUID> referenceIds, UUID userId);

  // Verifica se existem registros no histórico vinculados a uma origem do usuário
  boolean existsByReferenceIdAndUserId(UUID referenceId, UUID userId);

  default Optional<Boolean> existsAnyByReferenceIdsAndUserId(Collection<UUID> referenceIds, UUID userId) {
    return Optional.empty();
  }

  record RetrospectiveTxBucket(
      int year,
      int month,
      int day,
      int hour,
      int quarterHour,
      int tasksCompleted,
      int hardTasksCompleted,
      int xpEarned,
      BigDecimal coinsEarned) {}

  default Optional<List<RetrospectiveTxBucket>> aggregateForRetrospective(
      UUID userId, LocalDateTime startInclusive, LocalDateTime endExclusive) {
    return Optional.empty();
  }

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

  default Optional<LocalDateTime> findLatestTaskCompletionCreatedAtByUserId(UUID userId) {
    return Optional.empty();
  }

  default List<TransactionHistory> findTop2ByUserIdAndReferenceIdAndType(
      UUID userId, UUID referenceId, TransactionType transactionType) {
    return List.of();
  }

  default int updateFocusRewardSnapshot(
      UUID referenceId, UUID userId, int xpAmount, BigDecimal goldAmount) {
    return 0;
  }

  default int updateFocusDescriptionSnapshot(
      UUID referenceId, UUID userId, String descriptionSnapshot) {
    return 0;
  }

  default int updateFocusCompletedSnapshot(
      UUID referenceId,
      UUID userId,
      String nameSnapshot,
      String iconSnapshot,
      BigDecimal goldAmount,
      int xpAmount,
      List<String> tagsSnapshot,
      String descriptionSnapshot,
      LocalDateTime createdAt) {
    return 0;
  }

  record TaskCompletionTimestamp(UUID userId, LocalDateTime createdAt) {}

  default List<TaskCompletionTimestamp> findTaskCompletionsByUserIdsSince(
      Collection<UUID> userIds, LocalDateTime since) {
    return List.of();
  }
}
