package com.habitparty.application.ports;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;

import com.habitparty.core.domain.entities.focus.FocusRecord;

public interface FocusRecordRepository {
  FocusRecord save(FocusRecord record);
  Optional<FocusRecord> findById(UUID id);

  // Busca TODO o histórico do usuário (Gráficos gerais)
  List<FocusRecord> findAllByUserId(UUID userId);

  // Busca o histórico de uma ÚNICA atividade (Gráfico específico)
  List<FocusRecord> findAllByFocusActivityId(UUID focusActivityId);
  
  // Busca o histórico de uso de um ÚNICO item do inventário
  List<FocusRecord> findAllByInventoryItemId(UUID inventoryItemId);

  // Busca o histórico de foco vinculado a uma ÚNICA tarefa
  List<FocusRecord> findAllByTaskId(UUID taskId);

  void deleteById(UUID id);

  // Cascade Delete
  void deleteAllByFocusActivityId(UUID focusActivityId);

  void deleteAllByTaskId(UUID taskId);

  // Preservar Histórico: Seta a FK para null se a Atividade ou Tarefa for apagada
  void nullifyFocusActivityId(UUID focusActivityId);

  void nullifyTaskId(UUID taskId);

  Page<FocusRecord> findAllByFocusActivityId(UUID focusActivityId, int page, int size);

  Page<FocusRecord> findAllByTaskId(UUID taskId, int page, int size);

  Page<FocusRecord> findAllByUserId(UUID userId, int page, int size);

  // Soma de minutos produtivos de foco no dia de hoje (excluindo itens de inventário)
  int sumFocusMinutesToday(UUID userId);

  void deleteAllByUserId(UUID userId);
}
