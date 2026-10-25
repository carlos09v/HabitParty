package com.habitparty.application.usecases.task;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.BoardColumnRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.core.domain.entities.BoardColumn;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class MoveTaskUseCase {
    private final TaskRepository taskPort;
    private final BoardColumnRepository boardColumnPort;

    public MoveTaskUseCase(TaskRepository taskPort, BoardColumnRepository boardColumnPort) {
        this.taskPort = taskPort;
        this.boardColumnPort = boardColumnPort;
    }

    @Transactional
    public void execute(UUID userIdLogado, List<MoveTaskCommand> itemsToMove) {
        if (itemsToMove == null || itemsToMove.isEmpty()) {
            return;
        }

        List<Task> tasksToUpdate = new ArrayList<>();
        Map<UUID, BoardColumn> validatedColumns = new HashMap<>();

        for (MoveTaskCommand item : itemsToMove) {
            if (item.newOrderIndex() < 0) {
                throw new DomainValidationException("O índice de ordem não pode ser negativo.");
            }

            Task task = taskPort.findById(item.taskId())
                .orElseThrow(() -> new ResourceNotFoundException("Tarefa não encontrada: " + item.taskId()));
            task.validateOwnership(userIdLogado);

            UUID targetColumnId = item.boardColumnId() != null ? item.boardColumnId() : task.getBoardColumnId();
            validatedColumns.computeIfAbsent(targetColumnId, colId -> {
                BoardColumn column = boardColumnPort.findById(colId)
                    .orElseThrow(() -> new ResourceNotFoundException("Coluna de destino não encontrada: " + colId));
                column.validateOwnership(userIdLogado);
                return column;
            });

            task.moveTo(targetColumnId, item.newOrderIndex());
            tasksToUpdate.add(task);
        }

        taskPort.saveAll(tasksToUpdate);
    }
}
