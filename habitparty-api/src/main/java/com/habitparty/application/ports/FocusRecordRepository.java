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

  void deleteById(UUID id);

  // Cascade Delete
  void deleteAllByFocusActivityId(UUID focusActivityId);

  // Preservar Histórico: Seta a FK para null se a Atividade for apagada
  void nullifyFocusActivityId(UUID focusActivityId);

  Page<FocusRecord> findAllByFocusActivityId(UUID focusActivityId, int page, int size);

  // Soma de minutos produtivos de foco no dia de hoje (excluindo itens de inventário)
  int sumFocusMinutesToday(UUID userId);
}
