package com.habitparty.adapters.in.web.api;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.habitparty.adapters.in.web.dtos.request.CreateTaskDTO;
import com.habitparty.adapters.in.web.dtos.request.UpdateTaskDTO;
import com.habitparty.adapters.in.web.dtos.request.UpdateTaskOrderDTO;
import com.habitparty.application.ports.projections.DashboardTaskDTO;
import com.habitparty.adapters.in.web.dtos.response.TaskResponseDTO;
import com.habitparty.infrastructure.security.AuthenticatedUser;
import com.habitparty.core.domain.enums.task.TaskStatus;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RequestMapping("/tasks")
@Tag(name = "Tasks", description = "Endpoints para gerenciamento de Tarefas, Hábitos e Dailies")
public interface TaskApi {

    @Operation(summary = "Lista tarefas por coluna", description = "Retorna todas as tarefas de uma coluna específica.")
    @GetMapping("/column/{boardColumnId}")
    ResponseEntity<List<TaskResponseDTO>> getTaskListByColumnId(
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser userIdLogado,
        @PathVariable UUID boardColumnId);

    @Operation(summary = "Dashboard de Tarefas", description = "Lista as tarefas para o dashboard filtrado.")
    @GetMapping("/workspace/{workspaceId}/dashboard")
    ResponseEntity<Page<DashboardTaskDTO>> getDashboardTasks(
        @PathVariable UUID workspaceId,
        @RequestParam(defaultValue = "TODAY") String filter,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado);

    @Operation(summary = "Criar Tarefa", description = "Cria uma nova tarefa na coluna.")
    @PostMapping("/column/{boardColumnId}")
    ResponseEntity<TaskResponseDTO> createTask(
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser userIdLogado,
        @RequestBody @Valid CreateTaskDTO dto,
        @PathVariable UUID boardColumnId);

    @Operation(summary = "Atualizar Tarefa", description = "Atualiza os dados de uma tarefa existente.")
    @PutMapping("/{taskId}")
    ResponseEntity<TaskResponseDTO> updateTask(
        @PathVariable UUID taskId,
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser userIdLogado,
        @RequestBody @Valid UpdateTaskDTO dto);

    @Operation(summary = "Excluir Tarefa", description = "Deleta uma tarefa.")
    @DeleteMapping("/{taskId}")
    ResponseEntity<Void> deleteTask(
        @PathVariable UUID taskId,
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser userIdLogado);

    @Operation(summary = "Mover Tarefas (Drag and Drop)", description = "Atualiza a ordem de várias tarefas de uma vez.")
    @PutMapping("/move")
    ResponseEntity<Void> moveTasks(
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser userIdLogado,
        @RequestBody List<UpdateTaskOrderDTO> itemsToMove);

    @Operation(summary = "Alterar Status da Tarefa", description = "Altera o status de uma tarefa e ganha recompensa se concluída.")
    @PatchMapping("/{taskId}/status")
    ResponseEntity<TaskResponseDTO> changeStatus(
        @PathVariable UUID taskId,
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser userIdLogado,
        @RequestParam TaskStatus newStatus);

    @Operation(summary = "Registrar Pontuação de Hábito", description = "Registra a repetição positiva (+1) ou negativa (-1) de um hábito, calculando recompensas ou penalidades.")
    @PostMapping("/{taskId}/score")
    ResponseEntity<TaskResponseDTO> recordHabitScore(
        @PathVariable UUID taskId,
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser userIdLogado,
        @RequestParam(defaultValue = "1") int delta);
}
