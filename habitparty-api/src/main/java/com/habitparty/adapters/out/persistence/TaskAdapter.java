package com.habitparty.adapters.out.persistence;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import com.habitparty.application.ports.projections.DashboardTaskDTO;
import com.habitparty.application.ports.projections.TaskSearchWorkspaceCountDTO;
import com.habitparty.adapters.out.persistence.entities.ChecklistItemJpaEntity;
import com.habitparty.adapters.out.persistence.entities.TaskJpaEntity;
import com.habitparty.adapters.out.persistence.mappers.ChecklistItemMapper;
import com.habitparty.adapters.out.persistence.mappers.TaskMapper;
import com.habitparty.adapters.out.persistence.repository.ChecklistItemJpaRepository;
import com.habitparty.adapters.out.persistence.repository.TaskJpaRepository;
import com.habitparty.application.ports.TaskRepository;
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
    List<UUID> ids = entities.stream().map(TaskJpaEntity::getId).toList();
    Map<UUID, List<ChecklistItem>> checklists = loadChecklistsByTaskIds(ids);
    return entities.stream()
        .map(e -> taskMapper.toDomain(e, checklists.getOrDefault(e.getId(), List.of())))
        .toList();
  }

  // Para jobs em lote que não utilizam o checklist (rollover/penalidades/lembretes)
  private List<Task> toDomainListWithoutChecklist(List<? extends TaskJpaEntity> entities) {
    return entities.stream()
        .map(e -> taskMapper.toDomain(e, List.of()))
        .toList();
  }

  // ---------------------------------------------------------------------------

  @Override
  public Task save(Task task) {
    TaskJpaEntity entity = taskMapper.toEntity(task);
    TaskJpaEntity savedEntity = port.save(entity);
    // O checklist é persistido de forma independente (saveChecklistItem); preserva o estado em memória
    return taskMapper.toDomain(savedEntity, task.getChecklist());
  }

  @Override
  public void saveAll(List<Task> tasks) {
    if (tasks == null || tasks.isEmpty()) {
      return;
    }
    List<TaskJpaEntity> entities = tasks.stream()
        .map(taskMapper::toEntity)
        .toList();
    port.saveAll(entities);
  }

  @Override
  public List<Task> findRecurringTasksPage(int page, int size) {
    return toDomainListWithoutChecklist(port.findRecurringTasks(PageRequest.of(page, size)));
  }

  @Override
  public List<Task> findOverdueHardcoreTodos(LocalDate today) {
    return toDomainListWithoutChecklist(port.findOverdueHardcoreTodos(today));
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

    // Projeção escalar: [id, name, taskType, dueDate, columnName, isHardcore, daysOfWeek]
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
    // Escapa curingas do LIKE para que '%' e '_' digitados pelo usuário sejam tratados literalmente
    String escaped = query.toLowerCase()
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

  // Converte o array/lista de DailyDaysOfWeek (enum do domínio) para java.time.DayOfWeek
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
        .filter(v -> v != null)
        .map(v -> DayOfWeek.valueOf(v instanceof Enum<?> e ? e.name() : v.toString()))
        .toList();
  }

  @Override
  public Optional<Task> findById(UUID id) {
    return port.findById(id)
        .map(entity -> taskMapper.toDomain(entity,
            loadChecklistsByTaskIds(List.of(entity.getId())).getOrDefault(entity.getId(), List.of())));
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
  public int findMaxOrderIndexByBoardColumnId(UUID boardColumnId) {
    Integer maxIndex = port.findMaxOrderIndexByBoardColumnId(boardColumnId);
    return maxIndex != null ? maxIndex : -1;
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
    // TRUQUE DE PERFORMANCE: Como queremos salvar apenas o item (ex: toggle), 
    // não precisamos carregar a Task inteira do banco.
    // Usamos o getReferenceById para criar uma Task "oca" apenas com o ID!
    TaskJpaEntity dummyTask = port.getReferenceById(item.getTaskId());

    // Passamos o domínio e a Task oca para o mapper que você criou
    ChecklistItemJpaEntity entity = checklistMapper.toEntity(item, dummyTask);

    // Salva no banco (O método save devolve a entidade recém-salva)
    ChecklistItemJpaEntity savedEntity = checklistRepository.save(entity);

    return checklistMapper.toDomain(savedEntity);
  }

  @Override
  public void deleteChecklistItemById(UUID itemId) {
    checklistRepository.deleteById(itemId);
  }

  @Override
  public void deleteAllByBoardColumnId(UUID boardColumnId) {
    checklistRepository.deleteAllByBoardColumnId(boardColumnId);
    port.deleteAllByBoardColumnId(boardColumnId);
  }

  @Override
  public void deleteAllByBoardColumnIds(List<UUID> boardColumnIds) {
    if (boardColumnIds == null || boardColumnIds.isEmpty()) {
      return;
    }
    checklistRepository.deleteAllByBoardColumnIds(boardColumnIds);
    port.deleteAllByBoardColumnIds(boardColumnIds);
  }

  @Override
  public void deleteAllByUserId(UUID userId) {
    checklistRepository.deleteAllByUserId(userId);
    port.deleteAllByUserId(userId);
  }
}
