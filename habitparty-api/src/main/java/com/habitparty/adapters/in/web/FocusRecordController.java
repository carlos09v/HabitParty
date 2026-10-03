package com.habitparty.adapters.in.web;

import java.util.UUID;

import org.springframework.data.domain.Page;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.habitparty.adapters.in.web.dtos.request.CreateFocusRecordDTO;
import com.habitparty.adapters.in.web.dtos.request.UpdateFocusRecordDTO;
import com.habitparty.adapters.in.web.dtos.response.FocusRecordResponseDTO;
import com.habitparty.adapters.out.persistence.entities.UserJpaEntity;
import com.habitparty.application.usecases.focus.CreateFocusRecordUseCase;
import com.habitparty.application.usecases.focus.DeleteFocusRecordUseCase;
import com.habitparty.application.usecases.focus.GetFocusRecordsByActivityUseCase;
import com.habitparty.application.usecases.focus.UpdateFocusRecordUseCase;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/focus-records")
public class FocusRecordController {
  private final CreateFocusRecordUseCase createUseCase;
  private final UpdateFocusRecordUseCase updateUseCase;
  private final DeleteFocusRecordUseCase deleteUseCase;
  private final GetFocusRecordsByActivityUseCase getByActivityUseCase;

  public FocusRecordController(
      CreateFocusRecordUseCase createUseCase,
      UpdateFocusRecordUseCase updateUseCase,
      DeleteFocusRecordUseCase deleteUseCase,
      GetFocusRecordsByActivityUseCase getByActivityUseCase) {
    this.createUseCase = createUseCase;
    this.updateUseCase = updateUseCase;
    this.deleteUseCase = deleteUseCase;
    this.getByActivityUseCase = getByActivityUseCase;
  }

  // Carregamento Sob Demanda: Retorna o histórico paginado apenas quando o usuário abre o painel da atividade
  @GetMapping("/activity/{activityId}")
  public ResponseEntity<Page<FocusRecordResponseDTO>> getByActivity(
      @PathVariable UUID activityId,
      @RequestParam(defaultValue = "0") int page,
      @AuthenticationPrincipal UserJpaEntity usuarioLogado) {

    Page<FocusRecordResponseDTO> response = getByActivityUseCase.execute(usuarioLogado.getId(), activityId, page);
    return ResponseEntity.ok(response);
  }

  @PostMapping
  public ResponseEntity<FocusRecordResponseDTO> create(
      @RequestBody @Valid CreateFocusRecordDTO request,
      @AuthenticationPrincipal UserJpaEntity usuarioLogado) {

    FocusRecordResponseDTO response = createUseCase.execute(usuarioLogado.getId(), request);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @PutMapping("/{recordId}")
  public ResponseEntity<FocusRecordResponseDTO> update(
      @PathVariable UUID recordId,
      @RequestBody @Valid UpdateFocusRecordDTO request,
      @AuthenticationPrincipal UserJpaEntity usuarioLogado) {

    FocusRecordResponseDTO response = updateUseCase.execute(usuarioLogado.getId(), recordId, request);
    return ResponseEntity.ok(response);
  }

  @DeleteMapping("/{recordId}")
  public ResponseEntity<Void> delete(
      @PathVariable UUID recordId,
      @AuthenticationPrincipal UserJpaEntity usuarioLogado) {

    deleteUseCase.execute(usuarioLogado.getId(), recordId);
    return ResponseEntity.noContent().build();
  }
}
