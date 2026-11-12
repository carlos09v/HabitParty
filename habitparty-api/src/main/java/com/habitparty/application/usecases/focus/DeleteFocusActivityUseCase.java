package com.habitparty.application.usecases.focus;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.habitparty.application.ports.FocusActivityRepository;
import com.habitparty.application.ports.FocusRecordRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.core.domain.entities.focus.FocusRecord;
import com.habitparty.core.domain.entities.focus.FocusActivity;
import com.habitparty.core.exceptions.ResourceNotFoundException;

import jakarta.transaction.Transactional;

@Service
public class DeleteFocusActivityUseCase {
  private final FocusActivityRepository port;
  private final FocusRecordRepository focusRecordPort;
  private final TransactionHistoryRepository transactionPort;

    public DeleteFocusActivityUseCase(FocusActivityRepository port, FocusRecordRepository focusRecordPort,
            TransactionHistoryRepository transactionPort) {
        this.port = port;
        this.focusRecordPort = focusRecordPort;
        this.transactionPort = transactionPort;
    }

    @Transactional
    public void execute(UUID userIdLogado, UUID activityId, boolean deleteHistory) {
        FocusActivity activity = port.findById(activityId)
            .orElseThrow(() -> new ResourceNotFoundException("Atividade de foco não encontrada."));
        activity.validateOwnership(userIdLogado);

        if (deleteHistory) {
            // Remove os registros FOCUS_COMPLETED do Histórico vinculados às sessões desta atividade
            List<UUID> recordIds = focusRecordPort.findAllByFocusActivityId(activityId).stream()
                .map(FocusRecord::getId)
                .toList();
            transactionPort.deleteAllByReferenceIdsAndUserId(recordIds, userIdLogado);

            focusRecordPort.deleteAllByFocusActivityId(activityId);
        } else {
            focusRecordPort.nullifyFocusActivityId(activityId);
        }

        int deletedOrderIndex = activity.getOrderIndex();

        port.deleteById(activityId);

        // Reorganiza a lista, puxando todos os itens abaixo um passo para cima
        port.shiftOrderIndexDown(userIdLogado, deletedOrderIndex);
    }
}
