package com.habitparty.adapters.in.web;

import java.time.ZoneId;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import com.habitparty.adapters.in.web.api.FocusRecordApi;
import com.habitparty.adapters.in.web.dtos.request.CreateFocusRecordDTO;
import com.habitparty.adapters.in.web.dtos.request.UpdateFocusRecordDTO;
import com.habitparty.adapters.in.web.dtos.response.FocusRecordResponseDTO;
import com.habitparty.application.usecases.focus.CreateFocusRecordCommand;
import com.habitparty.application.usecases.focus.CreateFocusRecordUseCase;
import com.habitparty.application.usecases.focus.DeleteFocusRecordUseCase;
import com.habitparty.application.usecases.focus.GetFocusRecordsByActivityUseCase;
import com.habitparty.application.usecases.focus.GetFocusRecordsByTaskUseCase;
import com.habitparty.application.usecases.focus.GetUserFocusRecordsUseCase;
import com.habitparty.application.usecases.focus.UpdateFocusRecordUseCase;
import com.habitparty.application.usecases.user.UserTimeResolver;
import com.habitparty.infrastructure.security.AuthenticatedUser;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@RestController
public class FocusRecordController implements FocusRecordApi {
  private final CreateFocusRecordUseCase createUseCase;
  private final UpdateFocusRecordUseCase updateUseCase;
  private final DeleteFocusRecordUseCase deleteUseCase;
  private final GetFocusRecordsByActivityUseCase getByActivityUseCase;
  private final GetFocusRecordsByTaskUseCase getByTaskUseCase;
  private final GetUserFocusRecordsUseCase getUserRecordsUseCase;
  private final UserTimeResolver userTimeResolver;

  @Override
  public ResponseEntity<Page<FocusRecordResponseDTO>> getMyRecords(
      int page,
      int size,
      AuthenticatedUser usuarioLogado) {

    ZoneId userZone = userTimeResolver.resolveZone(usuarioLogado.id());
    Page<FocusRecordResponseDTO> response = getUserRecordsUseCase.execute(usuarioLogado.id(), page, size)
        .map(record -> FocusRecordResponseDTO.fromDomain(record, userZone));
    return ResponseEntity.ok(response);
  }

  @Override
  public ResponseEntity<Page<FocusRecordResponseDTO>> getByActivity(
      UUID activityId,
      int page,
      AuthenticatedUser usuarioLogado) {

    ZoneId userZone = userTimeResolver.resolveZone(usuarioLogado.id());
    Page<FocusRecordResponseDTO> response = getByActivityUseCase.execute(usuarioLogado.id(), activityId, page)
        .map(record -> FocusRecordResponseDTO.fromDomain(record, userZone));
    return ResponseEntity.ok(response);
  }

  @Override
  public ResponseEntity<Page<FocusRecordResponseDTO>> getByTask(
      UUID taskId,
      int page,
      AuthenticatedUser usuarioLogado) {

    ZoneId userZone = userTimeResolver.resolveZone(usuarioLogado.id());
    Page<FocusRecordResponseDTO> response = getByTaskUseCase.execute(usuarioLogado.id(), taskId, page)
        .map(record -> FocusRecordResponseDTO.fromDomain(record, userZone));
    return ResponseEntity.ok(response);
  }

  @Override
  public ResponseEntity<FocusRecordResponseDTO> create(
      CreateFocusRecordDTO request,
      AuthenticatedUser usuarioLogado) {

    var command = new CreateFocusRecordCommand(
        request.focusActivityId(),
        request.inventoryItemId(),
        request.taskId(),
        request.notes(),
        request.startTime(),
        request.endTime(),
        request.recordType(),
        request.completedPomos()
    );
    var record = createUseCase.execute(usuarioLogado.id(), command);
    ZoneId userZone = userTimeResolver.resolveZone(usuarioLogado.id());
    return ResponseEntity.status(HttpStatus.CREATED).body(FocusRecordResponseDTO.fromDomain(record, userZone));
  }

  @Override
  public ResponseEntity<FocusRecordResponseDTO> update(
      UUID recordId,
      UpdateFocusRecordDTO request,
      AuthenticatedUser usuarioLogado) {

    var record = updateUseCase.execute(usuarioLogado.id(), recordId, request.notes());
    ZoneId userZone = userTimeResolver.resolveZone(usuarioLogado.id());
    return ResponseEntity.ok(FocusRecordResponseDTO.fromDomain(record, userZone));
  }

  @Override
  public ResponseEntity<Void> delete(
      UUID recordId,
      boolean deleteHistory,
      AuthenticatedUser usuarioLogado) {

    deleteUseCase.execute(usuarioLogado.id(), recordId, deleteHistory);
    return ResponseEntity.noContent().build();
  }
}
