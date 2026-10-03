package com.habitparty.application.usecases.task;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.habitparty.adapters.in.web.dtos.request.UpdateTaskDTO;
import com.habitparty.adapters.in.web.dtos.response.TaskResponseDTO;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.core.domain.entities.task.Daily;
import com.habitparty.core.domain.entities.task.Habit;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.domain.entities.task.Todo;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service 
public class UpdateTaskUseCase {
  private final TaskRepository port;

    public UpdateTaskUseCase(TaskRepository port) {
        this.port = port;
    }

    public TaskResponseDTO execute(UUID taskId, UUID userIdLogado, UpdateTaskDTO dto) {
        Task task = port.findById(taskId)
            .orElseThrow(() -> new ResourceNotFoundException("Tarefa não encontrada."));
        task.validateOwnership(userIdLogado);

        // 2. Atualiza os campos comuns
        task.updateBaseDetails(
            dto.name(), dto.description(), dto.priority(), 
            dto.difficulty(), dto.tags(), dto.isHardcoreModeEnabled()
        );

        // 3. Atualiza os campos específicos usando Pattern Matching
        if (task instanceof Habit h) {
            h.updateHabitDetails(dto.habitType(), dto.resetCounter(), dto.importanceType());
        } 
        else if (task instanceof Daily d) {
            int safeRepeat = dto.repeatEvery() != null ? dto.repeatEvery() : 1;
            d.updateDailyDetails(dto.startDate(), dto.repeatType(), safeRepeat, 
                                 dto.daysOfWeek(), dto.monthlyOption());
        } 
        else if (task instanceof Todo t) {
            // Usa a matemática do Domínio para recalcular a data do alarme
            LocalDateTime newReminderAt = Todo.calculateReminderTime(
                dto.dueDate(), dto.reminderType(), dto.customReminderAt()
            );
            t.updateTodoDetails(dto.dueDate(), dto.reminderType(), newReminderAt);
        }

        Task savedTask = port.save(task);

        return TaskResponseDTO.fromDomain(savedTask);
    }
}
