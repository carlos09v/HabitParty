package com.habitparty.application.usecases.focus;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

import com.habitparty.adapters.in.web.dtos.response.FocusRecordResponseDTO;
import com.habitparty.application.ports.FocusActivityRepository;
import com.habitparty.application.ports.FocusRecordRepository;
import com.habitparty.core.domain.entities.focus.FocusActivity;
import com.habitparty.core.domain.entities.focus.FocusRecord;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class GetFocusRecordsByActivityUseCase {
  private final FocusRecordRepository port;
  private final FocusActivityRepository focusActivityPort;

  public GetFocusRecordsByActivityUseCase(FocusRecordRepository port, FocusActivityRepository focusActivityPort) {
    this.port = port;
    this.focusActivityPort = focusActivityPort;
  }

  public Page<FocusRecordResponseDTO> execute(UUID userIdLogado, UUID activityId, int page) {
    // Valida se a atividade existe e pertence ao usuário
    FocusActivity activity = focusActivityPort.findById(activityId)
        .orElseThrow(() -> new ResourceNotFoundException("Atividade não encontrada."));
    activity.validateOwnership(userIdLogado);

    // Busca paginado (fixado em 20 itens por página)
    Page<FocusRecord> pagedRecords = port.findAllByFocusActivityId(activityId, page, 20);

    return pagedRecords.map(FocusRecordResponseDTO::fromDomain);
  }
}
