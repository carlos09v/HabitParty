package com.habitparty.adapters.out.persistence.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.habitparty.adapters.out.persistence.entities.FocusActivityJpaEntity;

public interface FocusActivityJpaRepository extends JpaRepository<FocusActivityJpaEntity, UUID> {

  // Lista todas as atividades do usuário ordenadas perfeitamente para o Dashboard
  List<FocusActivityJpaEntity> findAllByUserIdOrderByOrderIndexAsc(UUID userId);

  // Essencial para a trava de máximo de 5 atividades
  int countByUserId(UUID userId);

  // Descobre a última posição usada pelo usuário. 
  // Usamos COALESCE para retornar -1 caso o usuário ainda não tenha nenhuma atividade.
  @Query("SELECT COALESCE(MAX(f.orderIndex), -1) FROM FocusActivityJpaEntity f WHERE f.userId = :userId")
  int findMaxOrderIndexByUserId(@Param("userId") UUID userId);

  // Desloca as atividades para BAIXO (subtrai 1 do index). 
  // Muito útil ao deletar uma atividade (ex: apagou a index 2, a index 3 vira 2, a 4 vira 3).
  @Modifying
  @Query("UPDATE FocusActivityJpaEntity f SET f.orderIndex = f.orderIndex - 1 WHERE f.userId = :userId AND f.orderIndex > :deletedOrderIndex")
  void shiftOrderIndexDown(@Param("userId") UUID userId, @Param("deletedOrderIndex") int deletedOrderIndex);

  @Modifying
  @Query("DELETE FROM FocusActivityJpaEntity f WHERE f.userId = :userId")
  void deleteAllByUserId(@Param("userId") UUID userId);
}
