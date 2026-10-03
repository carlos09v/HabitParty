package com.habitparty.adapters.in.web;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.habitparty.adapters.in.web.dtos.request.CreateFocusActivityDTO;
import com.habitparty.adapters.in.web.dtos.request.UpdateFocusActivityDTO;
import com.habitparty.adapters.in.web.dtos.request.UpdateFocusActivityOrderDTO;
import com.habitparty.adapters.in.web.dtos.response.FocusActivityResponseDTO;
import com.habitparty.adapters.out.persistence.entities.UserJpaEntity;
import com.habitparty.application.usecases.focus.CreateFocusActivityUseCase;
import com.habitparty.application.usecases.focus.DeleteFocusActivityUseCase;
import com.habitparty.application.usecases.focus.GetFocusActivitiesUseCase;
import com.habitparty.application.usecases.focus.ReorderFocusActivitiesUseCase;
import com.habitparty.application.usecases.focus.UpdateFocusActivityUseCase;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/focus-activities")
public class FocusActivityController {
  private final CreateFocusActivityUseCase createUseCase;
  private final UpdateFocusActivityUseCase updateUseCase;
  private final DeleteFocusActivityUseCase deleteUseCase;
  private final GetFocusActivitiesUseCase getUseCase;
  private final ReorderFocusActivitiesUseCase reorderUseCase;

  public FocusActivityController(
      CreateFocusActivityUseCase createUseCase,
      UpdateFocusActivityUseCase updateUseCase,
      DeleteFocusActivityUseCase deleteUseCase,
      GetFocusActivitiesUseCase getUseCase,
      ReorderFocusActivitiesUseCase reorderUseCase) {
    this.createUseCase = createUseCase;
    this.updateUseCase = updateUseCase;
    this.deleteUseCase = deleteUseCase;
    this.getUseCase = getUseCase;
    this.reorderUseCase = reorderUseCase;
  }

  @PostMapping
  public ResponseEntity<FocusActivityResponseDTO> create(
      @RequestBody @Valid CreateFocusActivityDTO dto,
      @AuthenticationPrincipal UserJpaEntity usuarioLogado) {
    FocusActivityResponseDTO response = createUseCase.execute(usuarioLogado.getId(), dto);

    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @GetMapping
  public ResponseEntity<List<FocusActivityResponseDTO>> getAll(
      @AuthenticationPrincipal UserJpaEntity usuarioLogado) {

    List<FocusActivityResponseDTO> responses = getUseCase.execute(usuarioLogado.getId());
    return ResponseEntity.ok(responses);
  }

  @PutMapping("/{activityId}")
  public ResponseEntity<FocusActivityResponseDTO> update(
      @PathVariable UUID activityId,
      @RequestBody @Valid UpdateFocusActivityDTO dto,
      @AuthenticationPrincipal UserJpaEntity usuarioLogado) {
    FocusActivityResponseDTO response = updateUseCase.execute(usuarioLogado.getId(), activityId, dto);
    return ResponseEntity.ok(response);
  }

  @DeleteMapping("/{activityId}")
  public ResponseEntity<Void> delete(
      @PathVariable UUID activityId,
      @PathVariable boolean deleteHistory,
      @AuthenticationPrincipal UserJpaEntity usuarioLogado) {
    deleteUseCase.execute(usuarioLogado.getId(), activityId, deleteHistory);
    return ResponseEntity.noContent().build();
  }

  @PutMapping("/reorder")
  public ResponseEntity<Void> reorder(
      @RequestBody @Valid List<UpdateFocusActivityOrderDTO> novaOrdemDtos,
      @AuthenticationPrincipal UserJpaEntity usuarioLogado) {
    reorderUseCase.execute(usuarioLogado.getId(), novaOrdemDtos);
    return ResponseEntity.noContent().build();
  }
}
