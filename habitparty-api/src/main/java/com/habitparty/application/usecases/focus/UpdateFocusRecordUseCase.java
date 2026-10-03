package com.habitparty.application.usecases.focus;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.habitparty.adapters.in.web.dtos.request.UpdateFocusRecordDTO;
import com.habitparty.adapters.in.web.dtos.response.FocusRecordResponseDTO;
import com.habitparty.application.ports.FocusRecordRepository;
import com.habitparty.core.domain.entities.focus.FocusRecord;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class UpdateFocusRecordUseCase {

  private final FocusRecordRepository port;

  public UpdateFocusRecordUseCase(FocusRecordRepository port) {
    this.port = port;
  }

  public FocusRecordResponseDTO execute(UUID userIdLogado, UUID recordId, UpdateFocusRecordDTO dto) {
    FocusRecord record = port.findById(recordId)
        .orElseThrow(() -> new ResourceNotFoundException("Registro de foco não encontrado."));
    record.validateOwnership(userIdLogado);

    // O Domínio atualiza apenas o que é seguro alterar após a criação
    record.updateNotes(dto.notes());

    FocusRecord savedRecord = port.save(record);

    return FocusRecordResponseDTO.fromDomain(savedRecord);
  }
}
