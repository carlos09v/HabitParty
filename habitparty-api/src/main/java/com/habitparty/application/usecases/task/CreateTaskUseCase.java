package com.habitparty.application.usecases.task;

import java.time.LocalDateTime;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.habitparty.adapters.in.web.dtos.request.CreateTaskDTO;
import com.habitparty.adapters.in.web.dtos.response.TaskResponseDTO;
import com.habitparty.application.ports.BoardColumnRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.core.domain.entities.BoardColumn;
import com.habitparty.core.domain.entities.task.ChecklistItem;
import com.habitparty.core.domain.entities.task.Daily;
import com.habitparty.core.domain.entities.task.Habit;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.domain.entities.task.Todo;
import com.habitparty.core.domain.enums.task.TaskDifficulty;
import com.habitparty.core.domain.enums.task.TaskStatus;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
@Transactional
public class CreateTaskUseCase {
  private final TaskRepository taskPort;
    private final BoardColumnRepository boardColumnPort;

    public CreateTaskUseCase(TaskRepository taskPort, BoardColumnRepository boardColumnPort) {
        this.taskPort = taskPort;
        this.boardColumnPort = boardColumnPort;
    }

    public TaskResponseDTO execute(UUID userIdLogado, UUID boardColumnId, CreateTaskDTO dto) {
        BoardColumn column = boardColumnPort.findById(boardColumnId)
            .orElseThrow(() -> new ResourceNotFoundException("Coluna não encontrada."));
        column.validateOwnership(userIdLogado);

        // Descobre qual é a última posição na lista para colocar a nova tarefa no final
        int maxIndex = taskPort.findMaxOrderIndexByBoardColumnId(boardColumnId);
        int newOrderIndex = maxIndex + 1;

        // 3. Dados automáticos de criação
        UUID newTaskId = UUID.randomUUID();
        LocalDateTime now = LocalDateTime.now();
        List<ChecklistItem> emptyChecklist = List.of();

        Task newTask;

        // A FÁBRICA: Decide quem instanciar baseado no Enum recebido!
        switch (dto.taskType()) {
            case HABIT -> {
                newTask = new Habit(
                    newTaskId, boardColumnId, userIdLogado, dto.name(), dto.description(),
                    newOrderIndex, dto.priority(), dto.tags(), TaskDifficulty.EASY, TaskStatus.PENDING,
                    dto.taskType(), dto.isHardcoreModeEnabled(), dto.dueDate(), now, emptyChecklist,
                    
                    // Campos do Hábito: Começa com Streak 0 e sem data de conclusão
                    0, dto.habitType(), dto.resetCounter(), dto.importanceType(), null
                );
            }
            case DAILY -> {
                // Se o usuário não mandou repetição, assume 1 (diário padrão)
                int safeRepeat = (dto.repeatEvery() != null) ? dto.repeatEvery() : 1;

                newTask = new Daily(
                    newTaskId, boardColumnId, userIdLogado, dto.name(), dto.description(),
                    newOrderIndex, dto.priority(), dto.tags(), dto.difficulty(), TaskStatus.PENDING,
                    dto.taskType(), dto.isHardcoreModeEnabled(), dto.dueDate(), now, emptyChecklist,
                    
                    // Campos do Daily: Streak 0, lastCompletedAt = null
                    0, dto.startDate(), dto.repeatType(), safeRepeat, dto.daysOfWeek(), dto.monthlyOption(), null
                );
            }
            case TODO -> {
                // Calcula a data exata do lembrete 
                LocalDateTime calculatedReminderAt = Todo.calculateReminderTime(
                    dto.dueDate(), 
                    dto.reminderType(), 
                    dto.customReminderAt()
                );

                newTask = new Todo(
                    newTaskId, boardColumnId, userIdLogado, dto.name(), dto.description(),
                    newOrderIndex, dto.priority(), dto.tags(), dto.difficulty(), TaskStatus.PENDING,
                    dto.taskType(), dto.isHardcoreModeEnabled(), dto.dueDate(), now, emptyChecklist, dto.reminderType(), calculatedReminderAt, null
                );
            }
            default -> throw new DomainValidationException("Tipo de tarefa inválido: " + dto.taskType());
        }

        Task savedTask = taskPort.save(newTask);

        return TaskResponseDTO.fromDomain(savedTask);
    }

}
