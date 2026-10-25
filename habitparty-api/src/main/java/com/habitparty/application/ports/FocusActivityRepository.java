package com.habitparty.application.ports;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.habitparty.core.domain.entities.focus.FocusActivity;

public interface FocusActivityRepository {
  // CRUD Básico
  FocusActivity save(FocusActivity activity);

  Optional<FocusActivity> findById(UUID id);

  void deleteById(UUID id);

  // Listagem para o Dashboard
  List<FocusActivity> findAllByUserIdOrderByOrderIndex(UUID userId);

  // Essencial limitar as 5 atividades.
  int countByUserId(UUID userId);

  // Descobre o último index do usuário para a nova atividade ir pro final da lista
  int getMaxOrderIndexByUserId(UUID userId);

  // Usados no UseCase de Reordenação e Deleção (para reacomodar os índices das outras atividades)
  void shiftOrderIndexDown(UUID userId, int startOrderIndex);

  // Salva várias de uma vez (Útil ao fazer drag-and-drop e salvar a lista toda)
  List<FocusActivity> saveAll(List<FocusActivity> activities);

  void deleteAllByUserId(UUID userId);
}
