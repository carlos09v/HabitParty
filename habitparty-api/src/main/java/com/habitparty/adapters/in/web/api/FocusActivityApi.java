package com.habitparty.adapters.in.web.api;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.habitparty.adapters.in.web.dtos.request.CreateFocusActivityDTO;
import com.habitparty.adapters.in.web.dtos.request.UpdateFocusActivityDTO;
import com.habitparty.adapters.in.web.dtos.request.UpdateFocusActivityOrderDTO;
import com.habitparty.adapters.in.web.dtos.response.FocusActivityResponseDTO;
import com.habitparty.infrastructure.security.AuthenticatedUser;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RequestMapping("/focus-activities")
@Tag(name = "Focus Activities", description = "Endpoints para gerenciamento de atividades de modo foco (Pomodoro/Cronômetro)")
public interface FocusActivityApi {

    @Operation(summary = "Criar Atividade de Foco", description = "Cadastra uma nova atividade de foco.")
    @PostMapping
    ResponseEntity<FocusActivityResponseDTO> create(
        @RequestBody @Valid CreateFocusActivityDTO dto,
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado
    );

    @Operation(summary = "Listar Atividades de Foco", description = "Retorna todas as atividades de foco do usuário logado.")
    @GetMapping
    ResponseEntity<List<FocusActivityResponseDTO>> getAll(
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado
    );

    @Operation(summary = "Atualizar Atividade de Foco", description = "Atualiza nome, ícone ou configurações da atividade de foco.")
    @PutMapping("/{activityId}")
    ResponseEntity<FocusActivityResponseDTO> update(
        @PathVariable UUID activityId,
        @RequestBody @Valid UpdateFocusActivityDTO dto,
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado
    );

    @Operation(summary = "Excluir Atividade de Foco", description = "Exclui a atividade de foco e opcionalmente seu histórico.")
    @DeleteMapping("/{activityId}")
    ResponseEntity<Void> delete(
        @PathVariable UUID activityId,
        @RequestParam(defaultValue = "false") boolean deleteHistory,
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado
    );

    @Operation(summary = "Reordenar Atividades de Foco", description = "Atualiza a ordem das atividades de foco.")
    @PutMapping("/reorder")
    ResponseEntity<Void> reorder(
        @RequestBody @Valid List<UpdateFocusActivityOrderDTO> novaOrdemDtos,
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado
    );
}
