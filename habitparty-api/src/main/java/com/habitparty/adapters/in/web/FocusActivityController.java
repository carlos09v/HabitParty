package com.habitparty.adapters.in.web;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import com.habitparty.adapters.in.web.api.FocusActivityApi;
import com.habitparty.adapters.in.web.dtos.request.CreateFocusActivityDTO;
import com.habitparty.adapters.in.web.dtos.request.UpdateFocusActivityDTO;
import com.habitparty.adapters.in.web.dtos.request.UpdateFocusActivityOrderDTO;
import com.habitparty.adapters.in.web.dtos.response.FocusActivityResponseDTO;
import com.habitparty.application.usecases.focus.CreateFocusActivityUseCase;
import com.habitparty.application.usecases.focus.DeleteFocusActivityUseCase;
import com.habitparty.application.usecases.focus.GetFocusActivitiesUseCase;
import com.habitparty.application.usecases.focus.ReorderFocusActivitiesUseCase;
import com.habitparty.application.usecases.focus.UpdateFocusActivityUseCase;
import com.habitparty.infrastructure.security.AuthenticatedUser;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@RestController
public class FocusActivityController implements FocusActivityApi {
  private final CreateFocusActivityUseCase createUseCase;
  private final UpdateFocusActivityUseCase updateUseCase;
  private final DeleteFocusActivityUseCase deleteUseCase;
  private final GetFocusActivitiesUseCase getUseCase;
  private final ReorderFocusActivitiesUseCase reorderUseCase;

  @Override
  public ResponseEntity<FocusActivityResponseDTO> create(
      CreateFocusActivityDTO dto,
      AuthenticatedUser usuarioLogado) {
    FocusActivityResponseDTO response = createUseCase.execute(usuarioLogado.id(), dto);

    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @Override
  public ResponseEntity<List<FocusActivityResponseDTO>> getAll(
      AuthenticatedUser usuarioLogado) {

    List<FocusActivityResponseDTO> responses = getUseCase.execute(usuarioLogado.id());
    return ResponseEntity.ok(responses);
  }

  @Override
  public ResponseEntity<FocusActivityResponseDTO> update(
      UUID activityId,
      UpdateFocusActivityDTO dto,
      AuthenticatedUser usuarioLogado) {
    FocusActivityResponseDTO response = updateUseCase.execute(usuarioLogado.id(), activityId, dto);
    return ResponseEntity.ok(response);
  }

  @Override
  public ResponseEntity<Void> delete(
      UUID activityId,
      boolean deleteHistory,
      AuthenticatedUser usuarioLogado) {
    deleteUseCase.execute(usuarioLogado.id(), activityId, deleteHistory);
    return ResponseEntity.noContent().build();
  }

  @Override
  public ResponseEntity<Void> reorder(
      List<UpdateFocusActivityOrderDTO> novaOrdemDtos,
      AuthenticatedUser usuarioLogado) {
    reorderUseCase.execute(usuarioLogado.id(), novaOrdemDtos);
    return ResponseEntity.noContent().build();
  }
}
