package com.habitparty.application.usecases.focus;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.FocusRecordRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.core.domain.entities.focus.FocusRecord;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
@Transactional
public class UpdateFocusRecordUseCase {
  private final FocusRecordRepository port;
  private final TransactionHistoryRepository transactionHistoryPort;

  public UpdateFocusRecordUseCase(FocusRecordRepository port) {
    this(port, null);
  }

  @Autowired
  public UpdateFocusRecordUseCase(
      FocusRecordRepository port,
      @Nullable TransactionHistoryRepository transactionHistoryPort) {
    this.port = port;
    this.transactionHistoryPort = transactionHistoryPort;
  }

  public FocusRecord execute(UUID userIdLogado, UUID recordId, String notes) {
    FocusRecord record = port.findById(recordId)
        .orElseThrow(() -> new ResourceNotFoundException("Registro de foco não encontrado."));
    record.validateOwnership(userIdLogado);

    record.updateNotes(notes);
    FocusRecord saved = port.save(record);

    if (transactionHistoryPort != null) {
      String descriptionSnapshot = saved.getNotes()
          .map(String::trim)
          .filter(n -> !n.isEmpty())
          .orElse(null);
      transactionHistoryPort.updateFocusDescriptionSnapshot(recordId, userIdLogado, descriptionSnapshot);
    }

    return saved;
  }
}
