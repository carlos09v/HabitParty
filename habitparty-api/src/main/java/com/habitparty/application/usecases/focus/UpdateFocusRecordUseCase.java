package com.habitparty.application.usecases.focus;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.FocusRecordRepository;
import com.habitparty.core.domain.entities.focus.FocusRecord;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
@Transactional
public class UpdateFocusRecordUseCase {
  private final FocusRecordRepository port;

  public UpdateFocusRecordUseCase(FocusRecordRepository port) {
    this.port = port;
  }

  public FocusRecord execute(UUID userIdLogado, UUID recordId, String notes) {
    FocusRecord record = port.findById(recordId)
        .orElseThrow(() -> new ResourceNotFoundException("Registro de foco não encontrado."));
    record.validateOwnership(userIdLogado);

    record.updateNotes(notes);

    return port.save(record);
  }
}
