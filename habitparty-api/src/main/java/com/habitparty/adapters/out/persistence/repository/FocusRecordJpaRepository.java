package com.habitparty.adapters.out.persistence.repository;

import java.time.LocalDateTime;
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

  // Soma de minutos produtivos de hoje (sem itens de inventário)
  @Query("""
      SELECT COALESCE(SUM(f.durationMinutes), 0)
      FROM FocusRecordJpaEntity f
      WHERE f.userId = :userId
        AND f.inventoryItemId IS NULL
        AND f.startTime >= :startOfDay
        AND f.startTime <= :endOfDay
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
}
