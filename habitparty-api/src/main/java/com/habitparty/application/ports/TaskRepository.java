package com.habitparty.application.ports;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.habitparty.application.ports.projections.DashboardTaskDTO;
import com.habitparty.core.domain.entities.task.ChecklistItem;
import com.habitparty.core.domain.entities.task.Task;

public interface TaskRepository {
  // Salva ou atualiza uma Task (seja Habit, Daily ou Todo)
  // O Checklist interno é salvo automaticamente por cascata!
  Task save(Task task);

  // O MOTOR DO DRAG-AND-DROP: Salva várias tarefas de uma vez
  void saveAll(List<Task> tasks);

  Optional<Task> findById(UUID id);

  // Busca todas as tarefas de uma coluna do Kanban, já ordenadas para a tela!
  List<Task> findByBoardColumnIdOrderByOrderIndexAsc(UUID boardColumnId);

  // Busca em lote todas as tarefas de múltiplas colunas (elimina N+1)
  List<Task> findByBoardColumnIdInOrderByOrderIndexAsc(List<UUID> boardColumnIds);

  List<Task> findAllRecurringTasks();

  List<Task> findOverdueHardcoreTodos(LocalDate today);

  List<Task> findPendingEmailReminders(LocalDateTime now, LocalDate today);

  long countActiveEmailRemindersByUserId(UUID userId);

  // Para quando a coluna estiver vazia e a primeira task precisar do index 0
  int findMaxOrderIndexByBoardColumnId(UUID boardColumnId);

  void deleteById(UUID id);

  // Cascata do boardColumn
  void deleteAllByBoardColumnId(UUID boardColumnId);

  void deleteAllByBoardColumnIds(List<UUID> boardColumnIds);

  void deleteAllByUserId(UUID userId);

  Page<DashboardTaskDTO> findDashboardTasks(UUID workspaceId, String filter, LocalDate today, Pageable pageable);

  // ChecklistItem
  Optional<ChecklistItem> findChecklistItemByIdAndUserId(UUID itemId, UUID userId);
  ChecklistItem saveChecklistItem(ChecklistItem item);
  void deleteChecklistItemById(UUID itemId);
}
