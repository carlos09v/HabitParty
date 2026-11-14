package com.habitparty.application.usecases.task;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.BoardColumnRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.usecases.workspace.WorkspaceWriteGuard;
import com.habitparty.core.domain.entities.BoardColumn;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class MoveTaskUseCase {
    private final TaskRepository taskPort;
    private final BoardColumnRepository boardColumnPort;
    private WorkspaceWriteGuard workspaceWriteGuard;

    public MoveTaskUseCase(TaskRepository taskPort, BoardColumnRepository boardColumnPort) {
        this.taskPort = taskPort;
        this.boardColumnPort = boardColumnPort;
    }

    @Autowired(required = false)
    public void setWorkspaceWriteGuard(WorkspaceWriteGuard workspaceWriteGuard) {
        this.workspaceWriteGuard = workspaceWriteGuard;
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

            UUID sourceColumnId = task.getBoardColumnId();
            BoardColumn sourceColumn = validatedColumns.computeIfAbsent(sourceColumnId, colId -> {
                BoardColumn column = boardColumnPort.findById(colId)
                    .orElseThrow(() -> new ResourceNotFoundException("Coluna de origem não encontrada: " + colId));
                column.validateOwnership(userIdLogado);
                if (workspaceWriteGuard != null) {
                    workspaceWriteGuard.assertWorkspaceWritable(
                        column.getWorkspaceId(),
                        userIdLogado,
                        "Este ambiente está em modo somente-leitura no plano Free (máximo de 2 ambientes ativos). Faça upgrade para Premium para mover tarefas dele!");
                }
                return column;
            });

            UUID targetColumnId = item.boardColumnId() != null ? item.boardColumnId() : sourceColumn.getId();
            validatedColumns.computeIfAbsent(targetColumnId, colId -> {
                BoardColumn column = boardColumnPort.findById(colId)
                    .orElseThrow(() -> new ResourceNotFoundException("Coluna de destino não encontrada: " + colId));
                column.validateOwnership(userIdLogado);
                if (workspaceWriteGuard != null) {
                    workspaceWriteGuard.assertWorkspaceWritable(
                        column.getWorkspaceId(),
                        userIdLogado,
                        "O ambiente de destino está em modo somente-leitura no plano Free (máximo de 2 ambientes ativos). Faça upgrade para Premium para mover tarefas para ele!");
                }
                return column;
            });

            task.moveTo(targetColumnId, item.newOrderIndex());
            tasksToUpdate.add(task);
        }

        taskPort.saveAll(tasksToUpdate);
    }
}
