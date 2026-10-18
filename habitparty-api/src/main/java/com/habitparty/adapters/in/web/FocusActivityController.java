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
import com.habitparty.application.usecases.focus.CreateFocusActivityCommand;
import com.habitparty.application.usecases.focus.CreateFocusActivityUseCase;
import com.habitparty.application.usecases.focus.DeleteFocusActivityUseCase;
import com.habitparty.application.usecases.focus.FocusActivityOrderCommand;
import com.habitparty.application.usecases.focus.GetFocusActivitiesUseCase;
import com.habitparty.application.usecases.focus.ReorderFocusActivitiesUseCase;
import com.habitparty.application.usecases.focus.UpdateFocusActivityCommand;
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
    var command = new CreateFocusActivityCommand(dto.name(), dto.icon(), dto.recordType(), dto.targetTimeMinutes());
    var activity = createUseCase.execute(usuarioLogado.id(), command);
    return ResponseEntity.status(HttpStatus.CREATED).body(FocusActivityResponseDTO.fromDomain(activity));
  }

  @Override
  public ResponseEntity<List<FocusActivityResponseDTO>> getAll(
      AuthenticatedUser usuarioLogado) {
    List<FocusActivityResponseDTO> responses = getUseCase.execute(usuarioLogado.id())
        .stream()
        .map(FocusActivityResponseDTO::fromDomain)
        .toList();
    return ResponseEntity.ok(responses);
  }

  @Override
  public ResponseEntity<FocusActivityResponseDTO> update(
      UUID activityId,
      UpdateFocusActivityDTO dto,
      AuthenticatedUser usuarioLogado) {
    var command = new UpdateFocusActivityCommand(dto.name(), dto.icon(), dto.recordType(), dto.pomoTimeMinutes());
    var activity = updateUseCase.execute(usuarioLogado.id(), activityId, command);
    return ResponseEntity.ok(FocusActivityResponseDTO.fromDomain(activity));
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
    List<FocusActivityOrderCommand> commands = novaOrdemDtos.stream()
        .map(dto -> new FocusActivityOrderCommand(dto.id(), dto.orderIndex()))
        .toList();
    reorderUseCase.execute(usuarioLogado.id(), commands);
    return ResponseEntity.noContent().build();
  }
}
