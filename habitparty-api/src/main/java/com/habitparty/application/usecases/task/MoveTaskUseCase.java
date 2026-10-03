package com.habitparty.application.usecases.task;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.habitparty.adapters.in.web.dtos.request.UpdateTaskOrderDTO;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class MoveTaskUseCase {
  private final TaskRepository taskPort;

    public MoveTaskUseCase(TaskRepository taskPort) {
        this.taskPort = taskPort;
    }

    public void execute(UUID userIdLogado, List<UpdateTaskOrderDTO> itemsToMove) {
        List<Task> tasksToUpdate = new ArrayList<>();

        for (UpdateTaskOrderDTO item : itemsToMove) {
            Task task = taskPort.findById(item.taskId())
                .orElseThrow(() -> new ResourceNotFoundException("Tarefa não encontrada: " + item.taskId()));
            task.validateOwnership(userIdLogado);

            task.moveTo(item.boardColumnId(), item.newOrderIndex());
            
            tasksToUpdate.add(task);
        }

        taskPort.saveAll(tasksToUpdate);
    }
}
