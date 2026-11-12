package com.habitparty.adapters.in.web.api;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.habitparty.adapters.in.web.dtos.request.CreateFocusRecordDTO;
import com.habitparty.adapters.in.web.dtos.request.UpdateFocusRecordDTO;
import com.habitparty.adapters.in.web.dtos.response.FocusRecordResponseDTO;
import com.habitparty.infrastructure.security.AuthenticatedUser;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RequestMapping("/focus-records")
@Tag(name = "Focus Records", description = "Endpoints para gerenciamento do histórico de sessões de foco")
public interface FocusRecordApi {

    @Operation(summary = "Histórico Geral de Foco do Usuário", description = "Retorna histórico paginado de todas as sessões de foco do usuário (atividades e tarefas).")
    @GetMapping("/me")
    ResponseEntity<Page<FocusRecordResponseDTO>> getMyRecords(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "50") int size,
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado
    );

    @Operation(summary = "Histórico de Foco por Atividade", description = "Retorna histórico paginado das sessões de foco de uma atividade.")
    @GetMapping("/activity/{activityId}")
    ResponseEntity<Page<FocusRecordResponseDTO>> getByActivity(
        @PathVariable UUID activityId,
        @RequestParam(defaultValue = "0") int page,
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado
    );

    @Operation(summary = "Histórico de Foco por Tarefa", description = "Retorna histórico paginado das sessões de foco vinculadas a uma tarefa do Kanban.")
    @GetMapping("/task/{taskId}")
    ResponseEntity<Page<FocusRecordResponseDTO>> getByTask(
        @PathVariable UUID taskId,
        @RequestParam(defaultValue = "0") int page,
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado
    );

    @Operation(summary = "Registrar Sessão de Foco", description = "Cria um novo registro de sessão de foco concluída.")
    @PostMapping
    ResponseEntity<FocusRecordResponseDTO> create(
        @RequestBody @Valid CreateFocusRecordDTO request,
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado
    );

    @Operation(summary = "Atualizar Registro de Foco", description = "Atualiza notas ou dados de uma sessão de foco.")
    @PutMapping("/{recordId}")
    ResponseEntity<FocusRecordResponseDTO> update(
        @PathVariable UUID recordId,
        @RequestBody @Valid UpdateFocusRecordDTO request,
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado
    );

    @Operation(summary = "Excluir Registro de Foco", description = "Remove um registro de sessão de foco. Use deleteHistory=true para remover também seu registro do Histórico.")
    @DeleteMapping("/{recordId}")
    ResponseEntity<Void> delete(
        @PathVariable UUID recordId,
        @RequestParam(defaultValue = "false") boolean deleteHistory,
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado
    );
}
