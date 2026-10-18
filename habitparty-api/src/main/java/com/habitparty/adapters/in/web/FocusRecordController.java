package com.habitparty.adapters.in.web;

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
import com.habitparty.application.usecases.focus.UpdateFocusRecordUseCase;
import com.habitparty.infrastructure.security.AuthenticatedUser;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@RestController
public class FocusRecordController implements FocusRecordApi {
  private final CreateFocusRecordUseCase createUseCase;
  private final UpdateFocusRecordUseCase updateUseCase;
  private final DeleteFocusRecordUseCase deleteUseCase;
  private final GetFocusRecordsByActivityUseCase getByActivityUseCase;

  @Override
  public ResponseEntity<Page<FocusRecordResponseDTO>> getByActivity(
      UUID activityId,
      int page,
      AuthenticatedUser usuarioLogado) {

    Page<FocusRecordResponseDTO> response = getByActivityUseCase.execute(usuarioLogado.id(), activityId, page)
        .map(FocusRecordResponseDTO::fromDomain);
    return ResponseEntity.ok(response);
  }

  @Override
  public ResponseEntity<FocusRecordResponseDTO> create(
      CreateFocusRecordDTO request,
      AuthenticatedUser usuarioLogado) {

    var command = new CreateFocusRecordCommand(
        request.focusActivityId(),
        request.inventoryItemId(),
        request.notes(),
        request.startTime(),
        request.endTime(),
        request.recordType(),
        request.completedPomos()
    );
    var record = createUseCase.execute(usuarioLogado.id(), command);
    return ResponseEntity.status(HttpStatus.CREATED).body(FocusRecordResponseDTO.fromDomain(record));
  }

  @Override
  public ResponseEntity<FocusRecordResponseDTO> update(
      UUID recordId,
      UpdateFocusRecordDTO request,
      AuthenticatedUser usuarioLogado) {

    var record = updateUseCase.execute(usuarioLogado.id(), recordId, request.notes());
    return ResponseEntity.ok(FocusRecordResponseDTO.fromDomain(record));
  }

  @Override
  public ResponseEntity<Void> delete(
      UUID recordId,
      AuthenticatedUser usuarioLogado) {

    deleteUseCase.execute(usuarioLogado.id(), recordId);
    return ResponseEntity.noContent().build();
  }
}
