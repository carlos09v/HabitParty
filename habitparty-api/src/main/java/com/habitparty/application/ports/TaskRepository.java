package com.habitparty.application.ports;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.habitparty.application.ports.projections.DashboardTaskDTO;
import com.habitparty.application.ports.projections.FocusableTaskDTO;
import com.habitparty.application.ports.projections.TaskSearchWorkspaceCountDTO;
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

  // Busca em lote para o Dashboard excluindo TODOs concluídos fora da janela recente
  default List<Task> findDashboardActiveByBoardColumnIds(
      List<UUID> boardColumnIds,
      LocalDate minDueDate,
      LocalDateTime minCompletedAt) {
    return findByBoardColumnIdInOrderByOrderIndexAsc(boardColumnIds);
  }

  // Busca sob demanda apenas os TODOs concluídos arquivados (fora da janela recente) de uma coluna
  default List<Task> findArchivedCompletedTodosByBoardColumnId(
      UUID boardColumnId,
      LocalDate minDueDate,
      LocalDateTime minCompletedAt) {
    return List.of();
  }

  // Busca paginada das tarefas recorrentes (HABIT/DAILY) para o rollover diário em lotes
  List<Task> findRecurringTasksPage(int page, int size);

  default List<Task> findRecurringTasksByUserIds(Collection<UUID> userIds) {
    return List.of();
  }

  List<Task> findOverdueHardcoreTodos(LocalDate today);

  default List<Task> findOverdueHardcoreTodosByUserIds(Collection<UUID> userIds, LocalDate maxDueDate) {
    return List.of();
  }

  List<Task> findPendingEmailReminders(LocalDateTime now, LocalDate today);

  long countActiveEmailRemindersByUserId(UUID userId);

  Map<UUID, Long> countActiveEmailRemindersByUserIds(Collection<UUID> userIds);

  // Para quando a coluna estiver vazia e a primeira task precisar do index 0
  int findMaxOrderIndexByBoardColumnId(UUID boardColumnId);

  default Optional<Integer> findOrderIndexByIdAndBoardColumnIdAndUserId(
      UUID taskId,
      UUID boardColumnId,
      UUID userId) {
    return findById(taskId)
        .filter(t -> t.getUserId().equals(userId) && t.getBoardColumnId().equals(boardColumnId))
        .map(Task::getOrderIndex);
  }

  default void shiftOrderIndexUpAfter(UUID boardColumnId, int afterOrderIndex) {
    List<Task> columnTasks = findByBoardColumnIdOrderByOrderIndexAsc(boardColumnId);
    List<Task> shiftedTasks = new java.util.ArrayList<>();
    for (Task colTask : columnTasks) {
      if (colTask.getOrderIndex() > afterOrderIndex) {
        colTask.moveTo(boardColumnId, colTask.getOrderIndex() + 1);
        shiftedTasks.add(colTask);
      }
    }
    if (!shiftedTasks.isEmpty()) {
      saveAll(shiftedTasks);
    }
  }

  void deleteById(UUID id);

  // Cascata do boardColumn
  void deleteAllByBoardColumnId(UUID boardColumnId);

  void deleteAllByBoardColumnIds(List<UUID> boardColumnIds);

  void deleteAllByUserId(UUID userId);

  void resetMetricsByUserId(UUID userId);

  Page<DashboardTaskDTO> findDashboardTasks(UUID workspaceId, String filter, LocalDate today, Pageable pageable);

  // Busca textual (nome/descrição) agregada por workspace, em todos os workspaces do usuário
  List<TaskSearchWorkspaceCountDTO> countMatchingTasksByWorkspace(UUID userId, String query);

  // Busca enxuta para o seletor de vínculo no Palco de Foco (/focus)
  default List<FocusableTaskDTO> findFocusableTasksByWorkspaceIds(UUID userId, Collection<UUID> workspaceIds) {
    return List.of();
  }

  // ChecklistItem
  Optional<ChecklistItem> findChecklistItemByIdAndUserId(UUID itemId, UUID userId);
  ChecklistItem saveChecklistItem(ChecklistItem item);
  void deleteChecklistItemById(UUID itemId);
}
