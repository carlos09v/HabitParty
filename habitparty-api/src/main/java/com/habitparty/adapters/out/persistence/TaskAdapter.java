package com.habitparty.adapters.out.persistence;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import com.habitparty.adapters.in.web.dtos.response.DashboardTaskDTO;
import com.habitparty.adapters.out.persistence.entities.ChecklistItemJpaEntity;
import com.habitparty.adapters.out.persistence.entities.DailyJpaEntity;
import com.habitparty.adapters.out.persistence.entities.TaskJpaEntity;
import com.habitparty.adapters.out.persistence.mappers.ChecklistItemMapper;
import com.habitparty.adapters.out.persistence.mappers.TaskMapper;
import com.habitparty.adapters.out.persistence.repository.ChecklistItemJpaRepository;
import com.habitparty.adapters.out.persistence.repository.TaskJpaRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.core.domain.entities.task.ChecklistItem;
import com.habitparty.core.domain.entities.task.Task;

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

  @Override
  public Task save(Task task) {
    TaskJpaEntity entity = taskMapper.toEntity(task);
    TaskJpaEntity savedEntity = port.save(entity);
    return taskMapper.toDomain(savedEntity);
  }

  @Override
  public void saveAll(List<Task> tasks) {
    List<TaskJpaEntity> entities = tasks.stream()
        .map(taskMapper::toEntity)
        .toList();
    port.saveAll(entities);
  }

  @Override
  public List<Task> findAllRecurringTasks() {
    return port.findAllRecurringTasks().stream()
        .map(taskMapper::toDomain)
        .toList();
  }

  @Override
  public Page<DashboardTaskDTO> findDashboardTasks(UUID workspaceId, String filter, LocalDate today,
      Pageable pageable) {

    // 1. Busca os dados brutos (Entidade + Nome da Coluna)
    Page<Object[]> results = port.findDashboardTasks(workspaceId, filter, today, pageable);

    // 2. Mapeia com segurança no Java
    return results.map(row -> {
        TaskJpaEntity t = (TaskJpaEntity) row[0];
        String columnName = (String) row[1];

        // Usa o Pattern Matching do Java para extrair os dias da semana (se for Daily)
        List<DayOfWeek> days = null;
        if (t instanceof DailyJpaEntity d) {
            if (d.getDaysOfWeek() != null) {
                // Traduz cada item da lista do seu Enum (DailyDaysOfWeek) para o Enum do Java (DayOfWeek)
                days = d.getDaysOfWeek().stream()
                        .map(customDay -> DayOfWeek.valueOf(customDay.name()))
                        .toList();
            }
        }

        return new DashboardTaskDTO(
            t.getId(),
            t.getName(),
            t.getTaskType(),
            t.getDueDate(),
            columnName,
            t.isHardcoreModeEnabled(),
            days
        );
    });
  }

  @Override
  public Optional<Task> findById(UUID id) {
    return port.findById(id)
        .map(taskMapper::toDomain);
  }

  @Override
  public List<Task> findByBoardColumnIdOrderByOrderIndexAsc(UUID boardColumnId) {
    return port.findByBoardColumnIdOrderByOrderIndexAsc(boardColumnId).stream()
        .map(taskMapper::toDomain)
        .toList();
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
    port.deleteAllByBoardColumnId(boardColumnId);
  }
}
