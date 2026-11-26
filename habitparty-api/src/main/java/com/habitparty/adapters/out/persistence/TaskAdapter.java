package com.habitparty.adapters.out.persistence;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.adapters.out.persistence.entities.ChecklistItemJpaEntity;
import com.habitparty.adapters.out.persistence.entities.TaskJpaEntity;
import com.habitparty.adapters.out.persistence.mappers.ChecklistItemMapper;
import com.habitparty.adapters.out.persistence.mappers.TaskMapper;
import com.habitparty.adapters.out.persistence.repository.ChecklistItemJpaRepository;
import com.habitparty.adapters.out.persistence.repository.TaskJpaRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.projections.DashboardTaskDTO;
import com.habitparty.application.ports.projections.FocusableTaskDTO;
import com.habitparty.application.ports.projections.TaskSearchWorkspaceCountDTO;
import com.habitparty.core.domain.entities.task.ChecklistItem;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.domain.enums.task.TaskType;

@Component
public class TaskAdapter implements TaskRepository {
  private final TaskJpaRepository port;
  private final ChecklistItemJpaRepository checklistRepository;
  private final TaskMapper taskMapper;
  private final ChecklistItemMapper checklistMapper;

  public TaskAdapter(TaskJpaRepository port,
      ChecklistItemJpaRepository checklistRepository,
      TaskMapper taskMapper,
      ChecklistItemMapper checklistMapper) {
    this.port = port;
    this.checklistRepository = checklistRepository;
    this.taskMapper = taskMapper;
    this.checklistMapper = checklistMapper;
  }

  // ---------------------------------------------------------------------------
  // Helpers: carregamento em lote do checklist (1 query por listagem, sem N+1)
  // ---------------------------------------------------------------------------

  private Map<UUID, List<ChecklistItem>> loadChecklistsByTaskIds(Collection<UUID> taskIds) {
    if (taskIds == null || taskIds.isEmpty()) {
      return Map.of();
    }
    return checklistRepository.findAllByTaskIds(taskIds).stream()
        .map(checklistMapper::toDomain)
        .collect(Collectors.groupingBy(ChecklistItem::getTaskId));
  }

  private List<Task> toDomainList(List<? extends TaskJpaEntity> entities) {
    if (entities == null || entities.isEmpty()) {
      return List.of();
    }
    List<UUID> checklistTaskIds = entities.stream()
        .filter(e -> e.getTaskType() != TaskType.HABIT)
        .map(TaskJpaEntity::getId)
        .toList();
    Map<UUID, List<ChecklistItem>> checklists = loadChecklistsByTaskIds(checklistTaskIds);
    return entities.stream()
        .map(e -> taskMapper.toDomain(e, checklists.getOrDefault(e.getId(), List.of())))
        .toList();
  }

  private List<Task> toDomainListWithoutChecklist(List<? extends TaskJpaEntity> entities) {
    return entities.stream()
        .map(e -> taskMapper.toDomain(e, List.of()))
        .toList();
  }

  // ---------------------------------------------------------------------------

  @Override
  public Task save(Task task) {
    TaskJpaEntity entity = port.findById(task.getId())
        .map(existing -> {
          taskMapper.updateEntityFromDomain(existing, task);
          return existing;
        })
        .orElseGet(() -> taskMapper.toEntity(task));
    TaskJpaEntity savedEntity = port.save(entity);
    // O checklist é persistido de forma independente (saveChecklistItem); preserva o estado em memória
    return taskMapper.toDomain(savedEntity, task.getChecklist());
  }

  @Override
  public void saveAll(List<Task> tasks) {
    if (tasks == null || tasks.isEmpty()) {
      return;
    }
    List<UUID> ids = tasks.stream()
        .map(Task::getId)
        .filter(Objects::nonNull)
        .toList();
    Map<UUID, TaskJpaEntity> existingById = port.findAllById(ids).stream()
        .collect(Collectors.toMap(TaskJpaEntity::getId, Function.identity(), (a, b) -> a));

    List<TaskJpaEntity> entities = new ArrayList<>(tasks.size());
    for (Task task : tasks) {
      TaskJpaEntity entity = existingById.get(task.getId());
      if (entity != null) {
        taskMapper.updateEntityFromDomain(entity, task);
      } else {
        entity = taskMapper.toEntity(task);
      }
      entities.add(entity);
    }
    port.saveAll(entities);
  }

  @Override
  public List<Task> findRecurringTasksByUserIds(Collection<UUID> userIds) {
    if (userIds == null || userIds.isEmpty()) {
      return List.of();
    }
    return toDomainList(port.findRecurringTasksByUserIds(userIds));
  }

  @Override
  public Optional<List<Task>> findRecurringTasksLightweightByUserIds(Collection<UUID> userIds) {
    if (userIds == null || userIds.isEmpty()) {
      return Optional.of(List.of());
    }
    return Optional.of(toDomainListWithoutChecklist(port.findRecurringTasksByUserIds(userIds)));
  }

  @Override
  public Optional<List<Task>> findAllByIds(Collection<UUID> ids) {
    if (ids == null || ids.isEmpty()) {
      return Optional.of(List.of());
    }
    return Optional.of(toDomainListWithoutChecklist(port.findAllById(ids)));
  }

  @Override
  public List<Task> findOverdueHardcoreTodos(LocalDate today) {
    return toDomainListWithoutChecklist(port.findOverdueHardcoreTodos(today));
  }

  @Override
  public List<Task> findOverdueHardcoreTodosByUserIds(Collection<UUID> userIds, LocalDate maxDueDate) {
    if (userIds == null || userIds.isEmpty()) {
      return List.of();
    }
    return toDomainList(port.findOverdueHardcoreTodosByUserIds(userIds, maxDueDate));
  }

  @Override
  public List<Task> findPendingEmailReminders(LocalDateTime now, LocalDate today) {
    return toDomainListWithoutChecklist(port.findPendingEmailReminders(now, today));
  }

  @Override
  public long countActiveEmailRemindersByUserId(UUID userId) {
    return port.countActiveEmailRemindersByUserId(userId);
  }

  @Override
  public Map<UUID, Long> countActiveEmailRemindersByUserIds(Collection<UUID> userIds) {
    if (userIds == null || userIds.isEmpty()) {
      return Map.of();
    }
    List<Object[]> rows = port.countActiveEmailRemindersByUserIds(userIds);
    Map<UUID, Long> result = new HashMap<>(rows.size());
    for (Object[] row : rows) {
      result.put((UUID) row[0], ((Number) row[1]).longValue());
    }
    return result;
  }

  @Override
  public Page<DashboardTaskDTO> findDashboardTasks(UUID workspaceId, String filter, LocalDate today,
      Pageable pageable) {
    Page<Object[]> results = port.findDashboardTasks(workspaceId, filter, today, pageable);

    return results.map(row -> new DashboardTaskDTO(
        (UUID) row[0],
        (String) row[1],
        (TaskType) row[2],
        (LocalDate) row[3],
        (String) row[4],
        Boolean.TRUE.equals(row[5]),
        toDaysOfWeek(row[6])));
  }

  @Override
  public List<TaskSearchWorkspaceCountDTO> countMatchingTasksByWorkspace(UUID userId, String query) {
    String escaped = query.toLowerCase(Locale.ROOT)
        .replace("\\", "\\\\")
        .replace("%", "\\%")
        .replace("_", "\\_");
    String pattern = "%" + escaped + "%";

    return port.countMatchingTasksByWorkspace(userId, pattern).stream()
        .map(row -> new TaskSearchWorkspaceCountDTO(
            (UUID) row[0],
            (String) row[1],
            ((Number) row[2]).longValue()))
        .toList();
  }

  @Override
  public List<FocusableTaskDTO> findFocusableTasksByWorkspaceIds(UUID userId, Collection<UUID> workspaceIds) {
    if (userId == null || workspaceIds == null || workspaceIds.isEmpty()) {
      return List.of();
    }
    return port.findFocusableTaskProjections(userId, workspaceIds).stream()
        .map(row -> new FocusableTaskDTO(
            (UUID) row[0],
            row[1] != null ? row[1].toString() : "",
            row[2] != null ? row[2].toString().toLowerCase(Locale.ROOT) : "daily",
            row[3] != null ? row[3].toString() : "",
            row[4] != null ? row[4].toString() : "",
            row[5] instanceof Number n ? n.intValue() : 0,
            row[6] instanceof Number n ? n.intValue() : 0,
            false))
        .toList();
  }

  private List<DayOfWeek> toDaysOfWeek(Object raw) {
    if (raw == null) {
      return null;
    }
    Collection<?> values;
    if (raw instanceof Collection<?> c) {
      values = c;
    } else if (raw instanceof Object[] arr) {
      values = List.of(arr);
    } else {
      return null;
    }
    return values.stream()
        .filter(Objects::nonNull)
        .map(v -> DayOfWeek.valueOf(v instanceof Enum<?> e ? e.name() : v.toString()))
        .toList();
  }

  @Override
  public Optional<Task> findById(UUID id) {
    return port.findById(id)
        .map(entity -> {
          List<ChecklistItem> checklist = entity.getTaskType() == TaskType.HABIT
              ? List.of()
              : loadChecklistsByTaskIds(List.of(entity.getId())).getOrDefault(entity.getId(), List.of());
          return taskMapper.toDomain(entity, checklist);
        });
  }

  @Override
  public List<Task> findByBoardColumnIdOrderByOrderIndexAsc(UUID boardColumnId) {
    return toDomainList(port.findByBoardColumnIdOrderByOrderIndexAsc(boardColumnId));
  }

  @Override
  public List<Task> findByBoardColumnIdInOrderByOrderIndexAsc(List<UUID> boardColumnIds) {
    if (boardColumnIds == null || boardColumnIds.isEmpty()) {
      return List.of();
    }
    return toDomainList(port.findByBoardColumnIdInOrderByOrderIndexAsc(boardColumnIds));
  }

  @Override
  public List<Task> findDashboardActiveByBoardColumnIds(
      List<UUID> boardColumnIds,
      LocalDate minDueDate,
      LocalDateTime minCompletedAt) {
    if (boardColumnIds == null || boardColumnIds.isEmpty()) {
      return List.of();
    }
    return toDomainList(port.findDashboardActiveByBoardColumnIdInOrderByOrderIndexAsc(
        boardColumnIds,
        minDueDate,
        minCompletedAt));
  }

  @Override
  public List<Task> findArchivedCompletedTodosByBoardColumnId(
      UUID boardColumnId,
      LocalDate minDueDate,
      LocalDateTime minCompletedAt) {
    if (boardColumnId == null) {
      return List.of();
    }
    return toDomainList(port.findArchivedCompletedTodosByBoardColumnId(
        boardColumnId,
        minDueDate,
        minCompletedAt));
  }

  @Override
  public List<UUID> findIdsByBoardColumnIds(Collection<UUID> boardColumnIds) {
    if (boardColumnIds == null || boardColumnIds.isEmpty()) {
      return List.of();
    }
    return port.findIdsByBoardColumnIdIn(boardColumnIds);
  }

  @Override
  public int findMaxOrderIndexByBoardColumnId(UUID boardColumnId) {
    Integer maxIndex = port.findMaxOrderIndexByBoardColumnId(boardColumnId);
    return maxIndex != null ? maxIndex : -1;
  }

  @Override
  public Optional<UUID> findBoardColumnIdById(UUID id) {
    if (id == null) {
      return Optional.empty();
    }
    return port.findBoardColumnIdById(id);
  }

  @Override
  public Optional<Integer> findOrderIndexByIdAndBoardColumnIdAndUserId(
      UUID taskId,
      UUID boardColumnId,
      UUID userId) {
    if (taskId == null || boardColumnId == null || userId == null) {
      return Optional.empty();
    }
    return port.findOrderIndexByIdAndBoardColumnIdAndUserId(taskId, boardColumnId, userId);
  }

  @Override
  public void shiftOrderIndexUpAfter(UUID boardColumnId, int afterOrderIndex) {
    if (boardColumnId == null) {
      return;
    }
    port.shiftOrderIndexUpAfter(boardColumnId, afterOrderIndex);
  }

  @Override
  public void deleteById(UUID id) {
    port.deleteById(id);
  }

  @Override
  public Optional<ChecklistItem> findChecklistItemByIdAndUserId(UUID itemId, UUID userId) {
    return checklistRepository.findByIdAndUserId(itemId, userId)
        .map(checklistMapper::toDomain);
  }

  @Override
  public ChecklistItem saveChecklistItem(ChecklistItem item) {
    int updated = checklistRepository.updateItemFields(
        item.getId(),
        item.getUserId(),
        item.getName(),
        item.isCompleted(),
        item.isRewarded(),
        item.getOrderIndex(),
        item.isAutoCompleted());
    if (updated > 0) {
      return item;
    }

    // Inserção de novo item: usa getReferenceById para referenciar a Task sem carregá-la inteira
    TaskJpaEntity dummyTask = port.getReferenceById(item.getTaskId());
    ChecklistItemJpaEntity entity = checklistMapper.toEntity(item, dummyTask);
    ChecklistItemJpaEntity savedEntity = checklistRepository.save(entity);

    return checklistMapper.toDomain(savedEntity);
  }

  @Override
  @Transactional
  public List<ChecklistItem> saveChecklistItems(List<ChecklistItem> items) {
    if (items == null || items.isEmpty()) {
      return List.of();
    }
    List<UUID> ids = items.stream()
        .map(ChecklistItem::getId)
        .filter(Objects::nonNull)
        .toList();
    Map<UUID, ChecklistItemJpaEntity> existingById = checklistRepository.findAllById(ids).stream()
        .collect(Collectors.toMap(ChecklistItemJpaEntity::getId, Function.identity(), (a, b) -> a));

    List<ChecklistItemJpaEntity> entities = new ArrayList<>(items.size());
    for (ChecklistItem item : items) {
      ChecklistItemJpaEntity entity = existingById.get(item.getId());
      if (entity != null) {
        checklistMapper.updateEntityFromDomain(entity, item);
      } else {
        entity = checklistMapper.toEntity(item, port.getReferenceById(item.getTaskId()));
      }
      entities.add(entity);
    }

    return checklistRepository.saveAll(entities).stream()
        .map(checklistMapper::toDomain)
        .toList();
  }

  @Override
  public void resetChecklistCompletionByTaskIds(Collection<UUID> taskIds) {
    if (taskIds == null || taskIds.isEmpty()) {
      return;
    }
    checklistRepository.resetCompletedByTaskIds(taskIds);
  }

  @Override
  public void deleteChecklistItemById(UUID itemId) {
    checklistRepository.deleteById(itemId);
  }

  @Override
  @Transactional
  public void deleteAllByBoardColumnId(UUID boardColumnId) {
    checklistRepository.deleteAllByBoardColumnId(boardColumnId);
    port.deleteAllByBoardColumnId(boardColumnId);
  }

  @Override
  @Transactional
  public void deleteAllByBoardColumnIds(List<UUID> boardColumnIds) {
    if (boardColumnIds == null || boardColumnIds.isEmpty()) {
      return;
    }
    checklistRepository.deleteAllByBoardColumnIds(boardColumnIds);
    port.deleteAllByBoardColumnIds(boardColumnIds);
  }

  @Override
  @Transactional
  public void deleteAllByUserId(UUID userId) {
    checklistRepository.deleteAllByUserId(userId);
    port.deleteAllByUserId(userId);
  }

  @Override
  @Transactional
  public void resetMetricsByUserId(UUID userId) {
    port.resetHabitMetricsByUserId(userId);
    port.resetDailyMetricsByUserId(userId);
    port.resetTaskFocusMetricsByUserId(userId);
  }
}
