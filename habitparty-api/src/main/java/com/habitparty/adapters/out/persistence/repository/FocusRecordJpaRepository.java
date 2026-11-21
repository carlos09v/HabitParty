package com.habitparty.adapters.out.persistence.repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.habitparty.adapters.out.persistence.entities.FocusRecordJpaEntity;

public interface FocusRecordJpaRepository extends JpaRepository<FocusRecordJpaEntity, UUID> {
  // Retorna ordenado pelo mais recente (para os gráficos e históricos ficarem na ordem certa)
  List<FocusRecordJpaEntity> findAllByUserIdOrderByStartTimeDesc(UUID userId);

  List<FocusRecordJpaEntity> findAllByFocusActivityIdOrderByStartTimeDesc(UUID focusActivityId);

  List<FocusRecordJpaEntity> findAllByInventoryItemIdOrderByStartTimeDesc(UUID inventoryItemId);

  List<FocusRecordJpaEntity> findAllByTaskIdOrderByStartTimeDesc(UUID taskId);

  // Deleta os registros em cascata
  @Modifying
  @Query("DELETE FROM FocusRecordJpaEntity f WHERE f.focusActivityId = :focusActivityId")
  void deleteAllByFocusActivityId(@Param("focusActivityId") UUID focusActivityId);

  @Modifying
  @Query("DELETE FROM FocusRecordJpaEntity f WHERE f.taskId = :taskId")
  void deleteAllByTaskId(@Param("taskId") UUID taskId);

  // Mantém os registros para o histórico, mas remove a referência da atividade excluída
  @Modifying
  @Query("UPDATE FocusRecordJpaEntity f SET f.focusActivityId = null WHERE f.focusActivityId = :focusActivityId")
  void nullifyFocusActivityId(@Param("focusActivityId") UUID focusActivityId);

  @Modifying
  @Query("UPDATE FocusRecordJpaEntity f SET f.taskId = null WHERE f.taskId = :taskId")
  void nullifyTaskId(@Param("taskId") UUID taskId);

  // Paginação para o histórico da Atividade, Tarefa ou Geral do Usuário
  Page<FocusRecordJpaEntity> findAllByFocusActivityIdOrderByStartTimeDesc(UUID focusActivityId, Pageable pageable);

  Page<FocusRecordJpaEntity> findAllByTaskIdOrderByStartTimeDesc(UUID taskId, Pageable pageable);

  Page<FocusRecordJpaEntity> findAllByUserIdOrderByStartTimeDesc(UUID userId, Pageable pageable);

  // Soma apenas minutos elegíveis à recompensa no dia (>= 10 min e teto de 90 min por sessão,
  // alinhado a FocusRewardCalculator.calculateRewardableMinutes), ignorando itens de inventário.
  @Query("""
      SELECT COALESCE(SUM(
        CASE
          WHEN f.durationMinutes < 10 THEN 0
          WHEN f.durationMinutes > 90 THEN 90
          ELSE f.durationMinutes
        END
      ), 0)
      FROM FocusRecordJpaEntity f
      WHERE f.userId = :userId
        AND f.inventoryItemId IS NULL
        AND f.endTime >= :startOfDay
        AND f.endTime <= :endOfDay
  """)
  int sumTodayFocusMinutesByUserId(
      @Param("userId") UUID userId,
      @Param("startOfDay") LocalDateTime startOfDay,
      @Param("endOfDay") LocalDateTime endOfDay);

  @Modifying
  @Query("DELETE FROM FocusRecordJpaEntity f WHERE f.userId = :userId")
  void deleteAllByUserId(@Param("userId") UUID userId);

  @Query("""
      SELECT COUNT(f) > 0
      FROM FocusRecordJpaEntity f
      WHERE f.taskId = :taskId
        AND f.focusActivityId IS NULL
  """)
  boolean existsStandaloneByTaskId(@Param("taskId") UUID taskId);

  List<FocusRecordJpaEntity> findAllByUserIdAndStartTimeBetweenOrderByStartTimeAsc(
      UUID userId, LocalDateTime startInclusive, LocalDateTime endInclusive);

  @Query("SELECT MIN(f.startTime) FROM FocusRecordJpaEntity f WHERE f.userId = :userId AND f.inventoryItemId IS NULL")
  LocalDateTime findEarliestProductiveStartTimeByUserId(@Param("userId") UUID userId);

  interface FocusActivityImpactProjection {
    long getTotalRecordsCount();

    Long getTotalXpEarned();

    BigDecimal getTotalCoinsEarned();
  }

  @Query("""
      SELECT COUNT(f) AS totalRecordsCount,
             COALESCE(SUM(f.xpEarned), 0) AS totalXpEarned,
             COALESCE(SUM(f.coinsEarned), 0) AS totalCoinsEarned
      FROM FocusRecordJpaEntity f
      WHERE f.focusActivityId = :focusActivityId
  """)
  FocusActivityImpactProjection summarizeImpactByFocusActivityId(
      @Param("focusActivityId") UUID focusActivityId);

  @Query("""
      SELECT COALESCE(MAX(f.durationMinutes), 0)
      FROM FocusRecordJpaEntity f
      WHERE f.userId = :userId
        AND f.inventoryItemId IS NULL
        AND f.durationMinutes >= 10
  """)
  int findMaxProductiveDurationMinutesByUserId(@Param("userId") UUID userId);

  @Query("""
      SELECT COALESCE(MAX(f.durationMinutes), 0)
      FROM FocusRecordJpaEntity f
      WHERE f.userId = :userId
        AND f.inventoryItemId IS NULL
        AND f.id <> :excludedRecordId
        AND f.durationMinutes >= 10
  """)
  int findMaxProductiveDurationMinutesExcludingRecord(
      @Param("userId") UUID userId,
      @Param("excludedRecordId") UUID excludedRecordId);

  @Query("""
      SELECT COALESCE(MAX(f.durationMinutes), 0)
      FROM FocusRecordJpaEntity f
      WHERE f.userId = :userId
        AND f.inventoryItemId IS NULL
        AND f.id NOT IN :excludedRecordIds
        AND f.durationMinutes >= 10
  """)
  int findMaxProductiveDurationMinutesExcludingRecords(
      @Param("userId") UUID userId,
      @Param("excludedRecordIds") Collection<UUID> excludedRecordIds);

  @Modifying
  @Query("""
      UPDATE FocusRecordJpaEntity f
      SET f.xpEarned = :xpEarned,
          f.coinsEarned = :coinsEarned
      WHERE f.id = :recordId
  """)
  int updateRewardsById(
      @Param("recordId") UUID recordId,
      @Param("xpEarned") int xpEarned,
      @Param("coinsEarned") BigDecimal coinsEarned);

  @Query("""
      SELECT COALESCE(SUM(f.durationMinutes), 0)
      FROM FocusRecordJpaEntity f
      WHERE f.userId = :userId
        AND f.inventoryItemId IS NULL
        AND f.endTime >= :startOfDay
        AND f.endTime <= :endOfDay
  """)
  int sumProductiveFocusMinutesByUserId(
      @Param("userId") UUID userId,
      @Param("startOfDay") LocalDateTime startOfDay,
      @Param("endOfDay") LocalDateTime endOfDay);

  interface ProductiveFocusSessionProjection {
    UUID getUserId();

    LocalDateTime getEndTime();

    int getDurationMinutes();
  }

  @Query("""
      SELECT f.userId AS userId, f.endTime AS endTime, f.durationMinutes AS durationMinutes
      FROM FocusRecordJpaEntity f
      WHERE f.userId IN :userIds
        AND f.inventoryItemId IS NULL
        AND f.endTime >= :since
  """)
  List<ProductiveFocusSessionProjection> findProductiveFocusSessionsByUserIdsSince(
      @Param("userIds") Collection<UUID> userIds,
      @Param("since") LocalDateTime since);

  @Query("""
      SELECT DISTINCT f.userId
      FROM FocusRecordJpaEntity f
      WHERE f.inventoryItemId IS NULL
  """)
  List<UUID> findDistinctProductiveUserIds();

  List<FocusRecordJpaEntity> findAllByUserIdAndEndTimeBetweenOrderByEndTimeAsc(
      UUID userId, LocalDateTime startInclusive, LocalDateTime endInclusive);

  @Query("""
      SELECT MIN(f.endTime)
      FROM FocusRecordJpaEntity f
      WHERE f.userId = :userId
        AND f.inventoryItemId IS NULL
  """)
  LocalDateTime findEarliestProductiveEndTimeByUserId(@Param("userId") UUID userId);
}
